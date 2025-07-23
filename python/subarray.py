def max_subarray(arr):
    max_sum = current_sum = arr[0]
    start = end = temp_start = 0

    for i in range(1, len(arr)):
        if current_sum < 0:
            current_sum = arr[i]
            temp_start = i
        else:
            current_sum += arr[i]

        if current_sum > max_sum:
            max_sum = current_sum
            start = temp_start
            end = i

    return max_sum, arr[start:end + 1]

# example usage
arr = [-1,9,-10,-10,-6,6,-4,10,8,9,6,-8,-4,7,-6,-6,6,-10,-9,4,-5,-4,3,-2,-1,-10,-10,-1]
result = max_subarray(arr)
print("Max Sum:", result[0])
print("Subarray:", result[1])
