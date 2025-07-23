import sys
from decimal import Decimal, getcontext

def sqrt_high_precision(num_str, precision=200):
    getcontext().prec = precision  # set precision, e.g. 200 digits
    num = Decimal(num_str)
    root = num.sqrt()
    return root

if len(sys.argv) < 2:
    print("Usage: python sqrt_high_precision.py <large_number>")
    sys.exit(1)
number_str = sys.argv[1]
result = sqrt_high_precision(number_str, precision=200)
print(result)
