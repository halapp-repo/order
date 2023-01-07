import moment from "moment";
import { inject, injectable } from "tsyringe";
import { Address } from "../models/address";
import { Order, OrderItem } from "../models/order";
import { OrderStatus } from "../models/order-status";
import OrderRepository from "../repositories/order.repository";
import { notEmpty } from "../utils/array";
import { trMoment } from "../utils/timezone";

@injectable()
export default class OrderService {
  constructor(
    @inject("OrderRepository")
    private repo: OrderRepository
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
    // Create order
    const order = Order.create({
      createdBy,
      deliveryAddress,
      items,
      organizationId,
      ts,
      note,
    });
    await this.repo.save(order);
    return order;
    // Send notification
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
}
