import { injectable } from "tsyringe";
import React from "react";
import { trMoment } from "../utils/timezone";
import puppeteer from "puppeteer-core";
const chromium = require("@sparticuz/chromium");
import * as ReactDOMServer from "react-dom/server";
import {
  DistantSaleContractContent,
  InventoryVM,
  OrderVM,
  OrganizationVM,
  translateExtraChargeType,
} from "@halapp/common";

@injectable()
export default class PDFService {
  async generateDistantSaleContract(
    order: OrderVM,
    organization: OrganizationVM,
    inventories: InventoryVM[]
  ): Promise<{
    s3Key: string;
    fileBody: Buffer;
  }> {
    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: chromium.defaultViewport,
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    });
    const page = await browser.newPage();
    const html = ReactDOMServer.renderToString(
      <DistantSaleContractContent
        deliveryAddress={`${order.DeliveryAddress.AddressLine} ${order.DeliveryAddress.County} ${order.DeliveryAddress.City} ${order.DeliveryAddress.ZipCode} ${order.DeliveryAddress.Country}`}
        invoiceAddress={`${organization.InvoiceAddress.AddressLine} ${organization.InvoiceAddress.County} ${organization.InvoiceAddress.City} ${organization.InvoiceAddress.ZipCode} ${organization.InvoiceAddress.Country}`}
        items={[
          ...order.Items.map((i) => ({
            Count: i.Count,
            Name:
              inventories.find((inv) => inv.ProductId === i.ProductId)?.Name ||
              i.ProductId,
            Price: i.Price || 0,
            Unit: i.Unit,
          })),
          ...(order.ExtraCharges || []).map((e) => ({
            Count: 1,
            Name: translateExtraChargeType(e.Type),
            Price: e.Price,
            Unit: "-",
          })),
        ]}
        orderCreatedDate={trMoment(order.CreatedDate).format("DD/MM/YYYY")}
        organizationAddress={`${organization.CompanyAddress.AddressLine} ${organization.CompanyAddress.County} ${organization.CompanyAddress.City} ${organization.CompanyAddress.ZipCode} ${organization.CompanyAddress.Country}`}
        organizationEmail={organization.Email}
        organizationName={organization.Name}
        organizationPhone={organization.PhoneNumber}
        todaysDate={trMoment(order.CreatedDate).format("DD/MM/YYYY")}
        totalPrice={order.TotalPrice}
      />
    );
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });
    const pdfBuffer = await page.pdf({
      format: "a4",
    });

    return {
      s3Key: `${order.Id}/contracts/uzaktan-satis-sozlesmesi.pdf`,
      fileBody: pdfBuffer,
    };
  }
  async getBufferFromStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const buffers: Buffer[] = [];
    return new Promise(function (resolve, reject) {
      stream.on("data", (data) => {
        buffers.push(data);
      });
      stream.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
      stream.on("error", reject);
    });
  }
}
