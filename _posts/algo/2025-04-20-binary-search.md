---
title: 二分查找算法简要
date: 2025-04-20
categories:
  - 算法
tags:
  - 算法
  - 二分查找
---

L+R 溢出：L+R 会溢出，所以要使用 L+(R-L)/2

二分查找需要根据查找的目标位置，是大于还是小于等于条件来确定移动的方向。

## 二分查找的三种写法

所谓区间，不是指答案所在的区间，而是指的是已经确认了是否**符合要求**的数字的区间和**不符合要求**的数字的区间。

均以升序数组，返回有序数组中第一个大于等于 target 的位置为例子，假设数组为：

[target-n, ..., target-1, target, target+1, ..., target+m]

### 闭区间

我们期望二分查找停止时：

L 是**符合要求**的数字的区间的左边界（包含），L 以及其右侧一定是满足条件的，左侧一定是不满足条件的，在示例中，L 指在 target 上。
R 是**不符合要求**的数字的区间的右边界（包含），R 及其左侧一定是不满足条件的，右侧一定是满足条件的，在示例中，R 指在 target-1 上。

| target-n | ... | target-1 | target | target+1,... | target+m |
|----------|-----|----------|---------|--------------|----------|
| ...      | ... | R⬆️      | L⬆️     | ...          | ...      |

L 就是我们要找的位置。

代码：

```python
def lower_bound(nums: List[int], target: int) -> int:
    left = 0
    right = len(nums) - 1
    while left <= right:
        # python中不是必要这么计算mid，但是C和Java等会出现溢出的语言是必要的
        mid = left + (right - left) // 2 
        if nums[mid] < target:
            left = mid + 1  # L的左侧一定是不满足条件的，所以可以将L往右移动
        else:
            right = mid - 1  # R的右侧是满足条件的
    return left
```

没有解的情况：所有的数字都小于target，返回len(num)。

### 开区间 （推荐，最简洁，不容易记混了，各种方向的移动都很好写）

我们期望二分查找停止时：

L 是**符合要求**的数字的区间的左边界（不包含），L 右侧一定是满足条件的，在示例中，L 指在 target-1 上。
R 是**不符合要求**的数字的区间的右边界（不包含），R 左侧一定是不满足条件的，在示例中，R 指在 target-1 上。

| target-n | ... | target-1 | target | target+1,... | target+m |
|----------|-----|----------|---------|--------------|----------|
| ...      | ... | L⬆️      | R⬆️     | ...          | ...      |

R 就是我们要找的位置。

```python
def lower_bound(nums: List[int], target: int) -> int:
    left = -1
    right = len(nums)
    while left + 1 < right:
        mid = left + (right - left) // 2 
        if nums[mid] < target:
            left = mid  # L的右侧是满足条件的，L左边和自己不满足
        else:
            right = mid  # R的左侧是不满足条件的，R右边和自己满足
    return right
```

没有解的情况：所有的数字都小于target，返回len(num)。

### 半开半闭区间，以左闭右开区间为例

我们期望二分查找停止时

L 是**符合要求**的数字的区间的左边界（包含）
R 是**不符合要求**的数字的区间的右边界（不包含）

| target-n | ... | target-1 | target | target+1,... | target+m |
|----------|-----|----------|---------|--------------|----------|
| ...      | ... | ...      |L⬆️  R⬆️ | ...          | ...      |

此时L和R都指向同一个位置，正确答案

```python
def lower_bound(nums: List[int], target: int) -> int:
    left = 0
    right = len(nums)
    while left < right:
        mid = left + (right - left + 1) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return right
```  

## 二分查找中的筛选条件

二分查找一定要注意是>=还是>,<还是<=。

以开区间为例子

>和>=几乎一样

L 是**符合要求**的数字的区间的左边界（不包含），L 右侧一定是满足条件的
R 是**不符合要求**的数字的区间的右边界（不包含），R 左侧一定是不满足条件的

| target-n | ... | target-1 | target | target+1|... | target+m |
|----------|-----|----------|---------|--------------|----------|
| ...      | ... | L⬆️      | R⬆️     | ...          | ...      |

结束条件是L+1==R，R为答案
<和<=几乎一样
L 是**不符合要求**的数字的区间的左边界（不包含），L 右侧一定是不满足条件的
R 是**=符合要求**的数字的区间的右边界（不包含），R 左侧一定是满足条件的

| target-n | ... | target-1 | target | target+1|... | target+m |
|----------|-----|----------|---------|--------------|----------|
| ...      | ... | ...      | L⬆️     | L⬆️          | ...      |

结束条件是L+1=R，L为答案
