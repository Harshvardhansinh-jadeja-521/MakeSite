from pydantic import BaseModel
from typing import Optional, List

class BusinessInfo(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    hours: Optional[str] = None
    contact: Optional[str] = None
    products: List[str] = []