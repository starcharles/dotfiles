"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Uses a binary search algorithm to locate a value in the specified array.
* @param items The array containing the item.
* @param value The value to search for.
* @return The zero-based index of the value in the array or -1 if not found.
*/
function binarySearch(items, value) {
    let startIndex = 0, stopIndex = items.length - 1, middle = Math.floor((stopIndex + startIndex) / 2);
    while (items[middle] !== value && startIndex < stopIndex) {
        //adjust search area
        if (value < items[middle]) {
            stopIndex = middle - 1;
        }
        else if (value > items[middle]) {
            startIndex = middle + 1;
        }
        //recalculate middle
        middle = Math.floor((stopIndex + startIndex) / 2);
    }
    //make sure it's the right value
    return (items[middle] !== value) ? -1 : middle;
}
exports.binarySearch = binarySearch;
/** Uses a binary search algorithm to locate a value in the specified array.
* @param items The array containing the item.
* @param  value The value to search for.
* @param comparer A function that determines between two objects which comes first.
* @return The zero-based index of the value in the array or -1 if not found.
*/
function binSearch(items, value, comparer) {
    let startIndex = 0, stopIndex = items.length - 1, middle = Math.floor((stopIndex + startIndex) / 2);
    while (comparer(value, items[middle]) !== 0 && startIndex < stopIndex) {
        //adjust search area
        if (comparer(value, items[middle]) < 0) {
            stopIndex = middle - 1;
        }
        else if (comparer(value, items[middle]) > 0) {
            startIndex = middle + 1;
        }
        //recalculate middle
        middle = Math.floor((stopIndex + startIndex) / 2);
        if (middle < 0 || middle >= items.length)
            return -1;
    }
    //make sure it's the right value
    return comparer(value, items[middle]) !== 0 ? -1 : middle;
}
exports.binSearch = binSearch;
//# sourceMappingURL=speedutil.js.map