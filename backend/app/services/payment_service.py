import razorpay
import time
from app.core.config import settings

class PaymentService:
    def __init__(self):
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        else:
            self.client = None
    
    def create_payment_order(self, amount: float, currency: str = "INR", receipt: str = None):
        """Create a Razorpay order for payment"""
        if not self.client:
            raise Exception("Razorpay not configured. Please add API keys to .env file")
        
        amount_in_paise = int(amount * 100)  # Convert to smallest currency unit
        
        order_data = {
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": receipt or f"order_{int(time.time())}",
            "payment_capture": 1  # Auto capture payment
        }
        
        order = self.client.order.create(data=order_data)
        return order
    
    def generate_upi_qr(self, order_id: str, amount: float, merchant_vpa: str = "merchant@upi"):
        """Generate UPI QR code link for payment"""
        # UPI Intent format
        upi_link = f"upi://pay?pa={merchant_vpa}&pn=SubscriptionFlow&am={amount}&tr={order_id}&tn=Payment for {order_id}"
        return upi_link
    
    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
        """Verify payment signature for security"""
        if not self.client:
            return False
        
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except:
            return False
    
    def get_payment_details(self, payment_id: str):
        """Get payment details"""
        if not self.client:
            return None
        return self.client.payment.fetch(payment_id)
    
    def get_order_details(self, order_id: str):
        """Get order details from Razorpay"""
        if not self.client:
            return None
        return self.client.order.fetch(order_id)

payment_service = PaymentService()
