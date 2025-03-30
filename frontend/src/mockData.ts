// Mock profile stats
export const mockStats = {
    total: 87,
    easy: 42,
    medium: 35,
    hard: 10
};

// Mock problems list
export const mockProblems = [
    {
        id: "1",
        title: "Two Sum",
        difficulty: "Easy",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        tags: ["Array", "Hash Table"],
        slug: "two-sum",
        notes: {
            topic: "Two Sum",
            question: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            intuition: "Use a hash map to store the numbers and their indices. For each number, check if its complement (target - current number) is in the hash map.",
            example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
            counterexample: "If there are duplicate numbers in the array, make sure to use the correct indices.",
            pseudocode: "1. Create a hash map\n2. Iterate through the array\n3. Check if target - current number exists in map\n4. If yes, return [map[target-current], current index]\n5. If no, add current number to map\n6. Return empty array if no solution",
            mistake: "I forgot to check if the complement exists before adding the current number to the map.",
            code: "function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map[complement] !== undefined) {\n      return [map[complement], i];\n    }\n    map[nums[i]] = i;\n  }\n  return [];\n}"
        }
    },
    {
        id: "2",
        title: "Add Two Numbers",
        difficulty: "Medium",
        description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
        tags: ["Linked List", "Math", "Recursion"],
        slug: "add-two-numbers",
        notes: {
            topic: "Add Two Numbers",
            question: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
            intuition: "Traverse both linked lists simultaneously and add the corresponding digits along with any carry from the previous addition.",
            example: "Input: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.",
            counterexample: "Different list lengths need special handling.",
            pseudocode: "1. Initialize carry = 0\n2. Initialize result head\n3. While l1 or l2 has nodes or carry is not 0\n   a. Sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry\n   b. carry = sum / 10\n   c. Create new node with val = sum % 10\n   d. Move l1 and l2 pointers if possible\n4. Return result head",
            mistake: "Forgot to handle the remaining carry after processing both lists.",
            code: "function addTwoNumbers(l1, l2) {\n  let dummy = new ListNode(0);\n  let curr = dummy;\n  let carry = 0;\n  \n  while (l1 || l2 || carry) {\n    let sum = carry;\n    if (l1) {\n      sum += l1.val;\n      l1 = l1.next;\n    }\n    if (l2) {\n      sum += l2.val;\n      l2 = l2.next;\n    }\n    \n    carry = Math.floor(sum / 10);\n    curr.next = new ListNode(sum % 10);\n    curr = curr.next;\n  }\n  \n  return dummy.next;\n}"
        }
    }
];
