import math

def no_ways_sum(s, n, threshold=None, limit=[]):
    if n == 1:
        if not limit or s in limit:
            return [[s]]
        return []
    ways = []
    highest = s - n + 1 # highest possible initial
    if threshold:
        highest = min(highest, threshold) # if there's an upper limit, bring it down
    lowest = math.ceil(s / n) # lowest possible initial
    if limit:
        highest = min(highest, max(limit))
        lowest = max(lowest, min(limit))
    current = highest
    while current >= lowest:
        if not limit or current in limit:
            ways += ([[current, *i] for i in no_ways_sum(s - current, n - 1, threshold=current)])
        current -= 1
    if limit:
        ways = [way for way in ways if not [i not in limit for i in way].count(True)] 
    return ways

s = 115
limit = [1,4,5,6,9,10,11,12,14,15,17,19]
final = []
for i in range(1, s):
    sm = no_ways_sum(s, i+1, limit=limit)
    final.append(sm)
    print(i+1, len(sm))
print(sum(len(i) for i in final))
