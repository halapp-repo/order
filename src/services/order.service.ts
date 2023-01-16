import createHttpError from "http-errors";
import moment from "moment";
import { inject, injectable } from "tsyringe";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";
import { Address } from "../models/address";
import { Order, OrderItem } from "../models/order";
import { OrderStatus } from "../models/order-status";
import OrderRepository from "../repositories/order.repository";
import { notEmpty } from "../utils/array";
import { trMoment } from "../utils/timezone";
import { SNSService } from "./sns.service";

@injectable()
export default class OrderService {
  constructor(
    @inject("OrderRepository")
    private repo: OrderRepository,
    @inject("SNSService")
    private snsService: SNSService,
    @inject("OrderToOrderViewModelMapper")
    private viewModelMapper: OrderToOrderViewModelMapper
  ) {}
  async create({
    createdBy,
    deliveryAddress,
    items,
    organizationId,
    ts,
    note,
  }: {
    createdBy: string;
    deliveryAddress: Address;
    items: OrderItem[];
    organizationId: string;
    ts: string;
    note?: string;
  }): Promise<Order> {
    console.log("OrderService is calling");
    // Create Order
    const order = Order.create({
      createdBy,
      deliveryAddress,
      items,
      organizationId,
      ts,
      note,
    });
    // Save Order
    await this.repo.save(order);
    // Send Notification
    await this.snsService.publishOrderCreatedMessage({
      orderVM: this.viewModelMapper.toDTO(order),
    });
    return order;
  }
  async getByOrganizationId({
    orgId,
    fromDate,
    toDate,
    status,
  }: {
    orgId: string;
    fromDate?: moment.Moment;
    toDate?: moment.Moment;
    status?: OrderStatus;
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
}
