from itertools import product

digits = "575842426"
target = 47
operators = ["", "+", "-", "*"]  # '' means no operator (concatenate digits)

def evaluate_expression(expr):
    try:
        return eval(expr)
    except:
        return None  # catch invalid expressions like division by zero

ls = []

for ops in product(operators, repeat=len(digits)-1):  # 8 slots between 9 digits
    expr = digits[0]
    for i, op in enumerate(ops):
        expr += op + digits[i + 1]
    if evaluate_expression(expr) == target:
        print(expr, "=", target)
        ls.append(expr)
print(ls)
