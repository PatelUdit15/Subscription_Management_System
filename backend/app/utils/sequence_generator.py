from sqlalchemy.orm import Session
from datetime import datetime

def generate_quotation_number(db: Session) -> str:
    """Generate quotation number in format: QT/YYYY/NNNN"""
    from app.models.quotation import Quotation
    
    current_year = datetime.now().year
    prefix = f"QT/{current_year}/"
    
    # Get last quotation for current year
    last_quotation = db.query(Quotation).filter(
        Quotation.number.like(f"{prefix}%")
    ).order_by(Quotation.number.desc()).first()
    
    if last_quotation:
        last_number = int(last_quotation.number.split('/')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

def generate_invoice_number(db: Session) -> str:
    """Generate invoice number in format: INV/YYYY/NNNN"""
    from app.models.invoice import Invoice
    
    current_year = datetime.now().year
    prefix = f"INV/{current_year}/"
    
    # Get last invoice for current year
    last_invoice = db.query(Invoice).filter(
        Invoice.number.like(f"{prefix}%")
    ).order_by(Invoice.number.desc()).first()
    
    if last_invoice:
        last_number = int(last_invoice.number.split('/')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

def generate_subscription_number(db: Session) -> str:
    """Generate subscription number in format: SUB/NNNN"""
    from app.models.subscription import Subscription
    
    prefix = "SUB/"
    
    # Get last subscription
    last_subscription = db.query(Subscription).filter(
        Subscription.id.isnot(None)
    ).order_by(Subscription.id.desc()).first()
    
    if last_subscription:
        new_number = last_subscription.id + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"
