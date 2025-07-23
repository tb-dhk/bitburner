def remove_invalid_parentheses(s):
    res = set()

    # first, calculate how many '(' and ')' to remove
    left_remove, right_remove = 0, 0
    for c in s:
        if c == '(':
            left_remove += 1
        elif c == ')':
            if left_remove > 0:
                left_remove -= 1
            else:
                right_remove += 1

    def backtrack(idx, left_count, right_count, left_rem, right_rem, path):
        if idx == len(s):
            if left_rem == 0 and right_rem == 0:
                res.add("".join(path))
            return

        c = s[idx]

        if c == '(':
            # option 1: remove '(' if we can
            if left_rem > 0:
                backtrack(idx + 1, left_count, right_count, left_rem - 1, right_rem, path)
            # option 2: keep '('
            path.append(c)
            backtrack(idx + 1, left_count + 1, right_count, left_rem, right_rem, path)
            path.pop()

        elif c == ')':
            # option 1: remove ')' if we can
            if right_rem > 0:
                backtrack(idx + 1, left_count, right_count, left_rem, right_rem - 1, path)
            # option 2: keep ')' only if it won’t make string invalid
            if right_count < left_count:
                path.append(c)
                backtrack(idx + 1, left_count, right_count + 1, left_rem, right_rem, path)
                path.pop()

        else:
            # just add any other character
            path.append(c)
            backtrack(idx + 1, left_count, right_count, left_rem, right_rem, path)
            path.pop()

    backtrack(0, 0, 0, left_remove, right_remove, [])
    return list(res)

print(remove_invalid_parentheses("(()(()(a))()a(a"))
