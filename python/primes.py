number = 965400350

prime = 2
primes = []
while number > 1:
    if not number % prime:
        number //= prime
        primes.append(prime)
    elif prime ** 2 > number:
        prime = number
    else:
        prime += 1
print(primes)
