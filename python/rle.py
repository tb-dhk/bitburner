def rle(string):
    result = ""
    while string:
        array = [i == string[0] for i in string]
        if False in array:
            number = array.index(False)
        else:
            number = len(string)
        number = min(number, 9)
        result += str(number) + string[0]
        string = string[number:]
    return result

print(rle("HHHHHHHHHhh33MMaNNccddaaaaaaaaaJvvCCCCCCCCCCCCkkaa888888YYYYYYY5WW33DBBBBB"))
