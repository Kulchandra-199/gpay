import type { Client, GooglePayment, ThreeDSecure } from "braintree-web";
import braintree from "braintree-web";

interface PaymentResult {
  nonce: string;
  deviceData?: string;
  liabilityShifted?: boolean;
  liabilityShiftPossible?: boolean;
}

interface TransactionInfo {
  currencyCode: string;
  totalPriceStatus: "FINAL" | "ESTIMATED";
  totalPrice: string;
}

export class PaymentService {
  private client: Client | null = null;
  private googlePayInstance: GooglePayment | null = null;
  private paymentsClient: google.payments.api.PaymentsClient | null = null;
  private threeDSecureInstance: ThreeDSecure | null = null;

  async initializePaymentService(): Promise<void> {
    try {
      // Initialize Google Pay client
      this.paymentsClient = new google.payments.api.PaymentsClient({
        environment: "PRODUCTION",
      });

      // Initialize Braintree client
      this.client = await braintree.client.create({
        authorization:
          "eyJ2ZXJzaW9uIjoyLCJhdXRob3JpemF0aW9uRmluZ2VycHJpbnQiOiJleUowZVhBaU9pSktWMVFpTENKaGJHY2lPaUpGVXpJMU5pSXNJbXRwWkNJNklqSXdNVGd3TkRJMk1UWXRjSEp2WkhWamRHbHZiaUlzSW1semN5STZJbWgwZEhCek9pOHZZWEJwTG1KeVlXbHVkSEpsWldkaGRHVjNZWGt1WTI5dEluMC5leUpsZUhBaU9qRTNNekV6TURNME1UZ3NJbXAwYVNJNkltSTFNV0kxWVRFekxUZGtZbUV0TkRJeVl5MDVObU14TFdNeE5XSXlOREkyWmpVNU1pSXNJbk4xWWlJNklucDRjV3B1TW5CM05IWjRiWGR3ZVRNaUxDSnBjM01pT2lKb2RIUndjem92TDJGd2FTNWljbUZwYm5SeVpXVm5ZWFJsZDJGNUxtTnZiU0lzSW0xbGNtTm9ZVzUwSWpwN0luQjFZbXhwWTE5cFpDSTZJbnA0Y1dwdU1uQjNOSFo0Ylhkd2VUTWlMQ0oyWlhKcFpubGZZMkZ5WkY5aWVWOWtaV1poZFd4MElqcG1ZV3h6Wlgwc0luSnBaMmgwY3lJNld5SnRZVzVoWjJWZmRtRjFiSFFpWFN3aWMyTnZjR1VpT2xzaVFuSmhhVzUwY21WbE9sWmhkV3gwSWwwc0ltOXdkR2x2Ym5NaU9udDlmUS54b3B1QXJVMGNubjNoVEtCVldGdlpsUUV6M2dEd2hCS0lvaGwtb1hQeFdKaDV6elNiYjlIekpKdExUbFV4TllxZUk0VlR0NXVVd0MzLVBWNkczSThYdyIsImNvbmZpZ1VybCI6Imh0dHBzOi8vYXBpLmJyYWludHJlZWdhdGV3YXkuY29tOjQ0My9tZXJjaGFudHMvenhxam4ycHc0dnhtd3B5My9jbGllbnRfYXBpL3YxL2NvbmZpZ3VyYXRpb24iLCJncmFwaFFMIjp7InVybCI6Imh0dHBzOi8vcGF5bWVudHMuYnJhaW50cmVlLWFwaS5jb20vZ3JhcGhxbCIsImRhdGUiOiIyMDE4LTA1LTA4IiwiZmVhdHVyZXMiOlsidG9rZW5pemVfY3JlZGl0X2NhcmRzIl19LCJjbGllbnRBcGlVcmwiOiJodHRwczovL2FwaS5icmFpbnRyZWVnYXRld2F5LmNvbTo0NDMvbWVyY2hhbnRzL3p4cWpuMnB3NHZ4bXdweTMvY2xpZW50X2FwaSIsImVudmlyb25tZW50IjoicHJvZHVjdGlvbiIsIm1lcmNoYW50SWQiOiJ6eHFqbjJwdzR2eG13cHkzIiwiYXNzZXRzVXJsIjoiaHR0cHM6Ly9hc3NldHMuYnJhaW50cmVlZ2F0ZXdheS5jb20iLCJhdXRoVXJsIjoiaHR0cHM6Ly9hdXRoLnZlbm1vLmNvbSIsInZlbm1vIjoib2ZmIiwiY2hhbGxlbmdlcyI6WyJjdnYiLCJwb3N0YWxfY29kZSJdLCJ0aHJlZURTZWN1cmVFbmFibGVkIjp0cnVlLCJhbmFseXRpY3MiOnsidXJsIjoiaHR0cHM6Ly9jbGllbnQtYW5hbHl0aWNzLmJyYWludHJlZWdhdGV3YXkuY29tL3p4cWpuMnB3NHZ4bXdweTMifSwiYXBwbGVQYXkiOnsiY291bnRyeUNvZGUiOiJJRSIsImN1cnJlbmN5Q29kZSI6IkdCUCIsIm1lcmNoYW50SWRlbnRpZmllciI6Im1lcmNoYW50LmNvbS50b29sc3RhdGlvbi5hcHBsZS1wYXkiLCJzdGF0dXMiOiJwcm9kdWN0aW9uIiwic3VwcG9ydGVkTmV0d29ya3MiOlsidmlzYSIsIm1hc3RlcmNhcmQiLCJhbWV4IiwibWFlc3RybyJdfSwicGF5cGFsRW5hYmxlZCI6dHJ1ZSwicGF5cGFsIjp7ImJpbGxpbmdBZ3JlZW1lbnRzRW5hYmxlZCI6dHJ1ZSwiZW52aXJvbm1lbnROb05ldHdvcmsiOmZhbHNlLCJ1bnZldHRlZE1lcmNoYW50IjpmYWxzZSwiYWxsb3dIdHRwIjpmYWxzZSwiZGlzcGxheU5hbWUiOiJUb29sc3RhdGlvbiIsImNsaWVudElkIjoiQVVIYUxaWnpxSDZyQ1FHTUV5Q05SaExZZmpNM0ZOVUpfbkNBNTZIMkFIa2x1VW9xMW1yR0VRU0dRRTMzN1Q2bDRZaVBPY0NzS3k4R2lKbmoiLCJiYXNlVXJsIjoiaHR0cHM6Ly9hc3NldHMuYnJhaW50cmVlZ2F0ZXdheS5jb20iLCJhc3NldHNVcmwiOiJodHRwczovL2NoZWNrb3V0LnBheXBhbC5jb20iLCJkaXJlY3RCYXNlVXJsIjpudWxsLCJlbnZpcm9ubWVudCI6ImxpdmUiLCJicmFpbnRyZWVDbGllbnRJZCI6IkFSS3JZUkRoM0FHWER6VzdzT18zYlNrcS1VMUM3SEdfdVdOQy16NTdMallTRE5VT1NhT3RJYTlxNlZwVyIsIm1lcmNoYW50QWNjb3VudElkIjoiVFNVS19CMkNfRUNPTSIsImN1cnJlbmN5SXNvQ29kZSI6IkdCUCJ9fQ==",
      });

      // Initialize Google Payment instance
      this.googlePayInstance = await braintree.googlePayment.create({
        client: this.client,
        googlePayVersion: 2,
      });

      // Initialize 3D Secure
      // this.threeDSecureInstance = await braintree.threeDSecure.create({
      //   client: this.client,
      //   version: 2,
      // });

      // Check and setup Google Pay button
      if (await this.isGooglePayAvailable()) {
        await this.createGooglePayButton();
      } else {
        throw new Error("Google Pay is not available on this device");
      }
    } catch (error) {
      console.error("Failed to initialize payment service:", error);
      throw error;
    }
  }

  private async createGooglePayButton(): Promise<void> {
    if (!this.googlePayInstance || !this.paymentsClient) {
      throw new Error("Payment service not properly initialized");
    }

    try {
      const buttonContainer = document.getElementById("google-pay");
      if (!buttonContainer) {
        throw new Error("Google Pay button container not found");
      }

      const button = this.paymentsClient.createButton({
        buttonColor: "default",
        buttonType: "plain",
        // Keep onClick handler inline as per Google Pay requirements
        onClick: async () => {
          try {
            // Create payment data request
            const transactionInfo: TransactionInfo = {
              currencyCode: "EUR",
              totalPriceStatus: "FINAL",
              totalPrice: "100.00",
            };

            const paymentDataRequest =
              this.googlePayInstance!.createPaymentDataRequest({
                transactionInfo,
                emailRequired: true,
                shippingAddressRequired: true,
                shippingAddressParameters: {
                  phoneNumberRequired: true,
                },
              });

            // Request payment data from Google Pay
            const paymentData = await this.paymentsClient!.loadPaymentData(
              paymentDataRequest
            );

            console.log(paymentData);

            // Process the payment with 3D Secure
            // const threeDSecureResult = await this.process3DSecure(paymentData);

            // // Handle successful payment
            // await this.handlePaymentSuccess(threeDSecureResult);
          } catch (error: any) {
            if (error.statusCode === "CANCELED") {
              console.log("User canceled the payment");
            } else {
              console.error("Payment failed:", error);
              await this.handlePaymentError(error);
            }
          }
        },
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: [
                "AMEX",
                "DISCOVER",
                "JCB",
                "MASTERCARD",
                "VISA",
              ],
            },
          },
        ],
      });

      buttonContainer.appendChild(button);
    } catch (error) {
      console.error("Failed to create Google Pay button:", error);
      throw error;
    }
  }

  private async process3DSecure(
    paymentData: google.payments.api.PaymentData
  ): Promise<PaymentResult> {
    if (!this.threeDSecureInstance) {
      throw new Error("3D Secure not initialized");
    }

    return new Promise((resolve, reject) => {
      this.threeDSecureInstance!.verifyCard(
        {
          amount: "100.00",
          nonce: paymentData.paymentMethodData.tokenizationData.token,
          billingAddress: paymentData.paymentMethodData.info.billingAddress,
          email: paymentData.email,
          bin: "4111111111111111",
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          if (!response.liabilityShifted && !response.liabilityShiftPossible) {
            reject(new Error("3D Secure verification failed"));
            return;
          }

          resolve({
            nonce: response.nonce,
            liabilityShifted: response.liabilityShifted,
            liabilityShiftPossible: response.liabilityShiftPossible,
          });
        }
      );
    });
  }

  private async handlePaymentSuccess(
    paymentResult: PaymentResult
  ): Promise<void> {
    try {
      // const response = await fetch("/api/process-payment", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     paymentMethodNonce: paymentResult.nonce,
      //     deviceData: paymentResult.deviceData,
      //     liabilityShifted: paymentResult.liabilityShifted,
      //     liabilityShiftPossible: paymentResult.liabilityShiftPossible,
      //   }),
      // });
      // if (!response.ok) {
      //   throw new Error(`Payment processing failed: ${response.statusText}`);
      // }
      // const result = await response.json();
      // console.log("Payment processed successfully:", result);
    } catch (error) {
      console.error("Failed to process payment:", error);
      throw error;
    }
  }

  private async handlePaymentError(error: Error): Promise<void> {
    console.error("Payment error:", error);
    // Add your error handling logic here
    throw error;
  }

  async isGooglePayAvailable(): Promise<boolean> {
    try {
      if (!this.googlePayInstance) return false;
      await this.googlePayInstance.createPaymentDataRequest();
      const isReadyToPay = await this.paymentsClient?.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA"],
            },
          },
        ],
      });
      return Boolean(isReadyToPay?.result);
    } catch (error) {
      console.error("Failed to check Google Pay availability:", error);
      return false;
    }
  }
}
