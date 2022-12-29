import * as moment from "moment";
import("moment-timezone");

export const trMoment = (...args: any) => moment(...args).tz("Europe/Istanbul");
