import { plainToInstance } from "class-transformer";
import { OrderMetadataRepositoryDTO } from "../models/dtos/order.metadata.repository.dto";
import { Order } from "../models/order";
import { IMapper } from "./base.mapper";

export class OrderToOrderMetadataRepositoryMapper extends IMapper<
  Order,
  OrderMetadataRepositoryDTO
> {
  toDTO(arg: Order): OrderMetadataRepositoryDTO {
    return {
      OrderID: `metadata#${arg.Id}`,
      TS: arg.CreatedDate.format(),
      OrgID: arg.OrganizationId,
      Status: arg.Status,
      Type: "Metadata",
    };
  }
  toModel(arg: OrderMetadataRepositoryDTO): Order {
    const [, id] = arg.OrgID.split("#");
    return plainToInstance(Order, {
      Id: id,
    });
  }
}
