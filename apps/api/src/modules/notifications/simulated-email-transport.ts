import { Injectable } from "@nestjs/common";
import { SimulatedEmailMessage } from "./notification-event.js";

/** Local delivery adapter. It intentionally performs no network I/O. */
@Injectable()
export class SimulatedEmailTransport {
  async deliver(message: SimulatedEmailMessage): Promise<void> {
    // A successful local simulation is recorded by NotificationService.
    void message;
  }
}
