def max_profit(prices):
    profit = 0
    for i in range(len(prices) - 1):
        if prices[i+1] > prices[i]:
            profit += prices[i+1] - prices[i]
    return profit

ls = [115,65,18,8,67,192,189,116,82,112,187,173,134,95,59,52,159,125,118,152,122,164,62,19,84,86,80,199,78,3,113,173,145,29,156,30,196,149,48,61,44,71,87,199,143]
print(max_profit(ls))
