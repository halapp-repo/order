import createHttpError from "http-errors";
import moment from "moment";
import { inject, injectable } from "tsyringe";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";
import { Address } from "../models/address";
import { Order, OrderItem } from "../models/order";
import {
  CityType,
  OrderStatusType,
  OrganizationVM,
  PaymentMethodType,
  ProductType,
} from "@halapp/common";
import OrderRepository from "../repositories/order.repository";
import { notEmpty } from "../utils/array";
import { trMoment } from "../utils/timezone";
import { SNSService } from "./sns.service";
import ListingService from "./listing.service";
import { OrderModelService } from "../models/services/order.model.service";
import OrganizationService from "./organization.service";

@injectable()
export default class OrderService {
  constructor(
    @inject("OrderRepository")
    private repo: OrderRepository,
    @inject("SNSService")
    private snsService: SNSService,
    @inject("OrderToOrderViewModelMapper")
    private viewModelMapper: OrderToOrderViewModelMapper,
    @inject("ListingService")
    private listingService: ListingService,
    @inject("OrganizationService")
    private organizationService: OrganizationService,
    @inject("OrderModelService")
    private orderModelService: OrderModelService
  ) {}
  async create({
    city,
    paymentMethodType,
    createdBy,
    deliveryAddress,
    items,
    organization,
    ts,
    note,
    deliveryTime,
  }: {
    city: CityType;
    paymentMethodType: PaymentMethodType;
    createdBy: string;
    deliveryAddress: Address;
    items: OrderItem[];
    organization: OrganizationVM;
    ts: string;
    note?: string;
    deliveryTime: string;
  }): Promise<Order> {
    console.log("OrderService is calling");
    // Create Order
    const order = Order.create({
      city,
      paymentMethodType,
      createdBy,
      deliveryAddress,
      items,
      organizationId: organization.ID,
      ts,
      note,
      deliveryTime,
    });

    const prices = await this.listingService.getActivePrices(
      city,
      ProductType.produce
    );
    if (
      !this.orderModelService.doesOrderHaveValidPrices(order, prices) ||
      !this.orderModelService.doesOrderHaveEnoughCredit(
        order,
        organization.Balance + organization.CreditLimit
      )
    ) {
      throw createHttpError.BadRequest();
    }
    if (
      paymentMethodType === PaymentMethodType.card ||
      organization.Balance >= order.TotalPrice
    ) {
      order.pay(createdBy);
    }
    // Save Order
    await this.repo.save(order);
    // Send Notification
    await this.snsService.publishOrderCreatedMessage({
      order: order,
    });
    return order;
  }
  async getAllByOrganizationId({
    orgId,
    fromDate,
    toDate,
    status,
  }: {
    orgId: string;
    fromDate?: moment.Moment;
    toDate?: moment.Moment;
    status?: OrderStatusType;
  }): Promise<Order[]> {
    if (!fromDate) {
      fromDate = trMoment("20230101", "YYYYMMDD");
    }
    if (!toDate) {
      toDate = trMoment();
    }
    let orderIds;
    if (!status) {
      orderIds = await this.repo.getIdsByOrgId(orgId, fromDate, toDate);
    } else {
      orderIds = await this.repo.getIdsByStatus(status, orgId);
    }
    const orderPromises: Promise<Order | null>[] = [];
    for (const orderId of orderIds || []) {
      orderPromises.push(this.repo.get(orderId));
    }
    const orders = await Promise.all(orderPromises);
    return orders
      .filter(notEmpty)
      .filter(
        (o) =>
          o.CreatedDate.isAfter(fromDate!) && o.CreatedDate.isBefore(toDate!)
      );
  }
  async getById(orderId: string): Promise<Order> {
    const order = await this.repo.get(orderId);
    if (!order) {
      throw createHttpError.InternalServerError();
    }
    return order;
  }
  async updateStatus(
    order: Order,
    newStatus: OrderStatusType,
    updateUserId: string
  ): Promise<Order> {
    console.log(
      `Order Status is changing. From ${order.Status} To ${newStatus}`
    );
    if (newStatus === OrderStatusType.Canceled) {
      order.cancel(updateUserId);
      await this.snsService.publishOrderCanceledMessage({ order });
    } else if (newStatus === OrderStatusType.PickedUp) {
      order.pickUp(updateUserId);
    } else if (newStatus === OrderStatusType.Delivered) {
      order.deliver(updateUserId);
      await this.snsService.publishOrderDeliveredMessage({ order });
    }
    await this.repo.save(order);
    return order;
  }
  async updateItems(order: Order, newItems: OrderItem[], updateUserId: string) {
    const { deletedItems } = order.updateItems(newItems, updateUserId);
    await this.repo.save(order);
    await this.snsService.publishOrderItemsUpdatedMessage({
      order: order,
      deletedItems: deletedItems,
    });

    return order;
  }
  async getAll({
    fromDate,
    toDate,
    status,
  }: {
    fromDate?: moment.Moment;
    toDate?: moment.Moment;
    status?: OrderStatusType;
  }): Promise<Order[]> {
    console.log("getAll is called");
    console.log(
      JSON.stringify({
        fromDate: fromDate,
        toDate: toDate,
        status: status,
      })
    );
    if (!fromDate && !toDate && !status) {
      throw createHttpError.BadRequest();
    }
    let orderIds;
    if (fromDate && toDate) {
      orderIds = await this.repo.getIdsByDate(fromDate, toDate);
    } else {
      orderIds = await this.repo.getIdsByStatus(status!);
    }
    const orderPromises: Promise<Order | null>[] = [];
    for (const orderId of orderIds || []) {
      orderPromises.push(this.repo.get(orderId));
    }
    const orders = await Promise.all(orderPromises);
    return orders.filter(notEmpty).filter((o) => {
      if (!status) {
        return true;
      } else {
        return o.Status === status;
      }
    });
  }
}
