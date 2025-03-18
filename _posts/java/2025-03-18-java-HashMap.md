---
layout: post
title: HashMap的常见知识点
date: 2025-03-18
categories: [Java]
tags: [Java, HashMap]
---


## resize机制概述

HashMap的resize（扩容）机制是其性能和空间利用的关键。在以下两种情况下会触发resize：

1. 初始化时：首次插入元素时进行的初始化操作
2. 扩容时：当HashMap中的键值对数量超过阈值（threshold）时

## 扩容的基本原理

### 容量特性

- HashMap的容量（capacity）总是2的幂次方，如16、32、64等
- 每次扩容都是扩展为原容量的2倍
- 这种特性使得HashMap可以使用位运算来优化将原数组中的数据重新Map到新的数组的运算

### 索引计算优化

在HashMap中，元素的位置是通过对key的hash值进行取模来确定的。由于容量始终是2的幂次方，因此可以将取模运算优化为位运算：

```java
index = hash & (capacity - 1)
```

## 扩容过程详解

### 扩容的核心步骤

1. 创建一个新的数组，其容量是原来的两倍
2. 重新计算每个节点在新数组中的位置
3. 将所有节点迁移到新数组中

### 新索引的计算原理

假设扩容前的容量为capacity，扩容后的容量为newCapacity = capacity * 2，则：

1. 原索引计算：
   ```java
   index = hash & (capacity - 1)
   ```

2. 新索引计算：
   ```java
   newIndex = hash & (newCapacity - 1)
   ```
   由于 newCapacity = capacity * 2
   ```java
   newCapacity - 1 = (capacity * 2) - 1 = (capacity - 1) | capacity
   ```

   由于newCapacity是capacity的2倍，在二进制表示中，newCapacity - 1比capacity - 1多了一个最高位的1

### 节点迁移的数学原理

在扩容过程中，HashMap需要遍历原数组中的每个桶，并将其中的所有节点重新分配到新数组中。由于newCapacity是capacity的2倍，在二进制表示中，newCapacity - 1比capacity - 1多了一个最高位的1。这导致了一个有趣的现象：

对于原数组中的每个节点，在重新分配时：
- 当该节点的 `hash & capacity == 0` 时：节点位置保持不变（newIndex = index）
- 当该节点的 `hash & capacity != 0` 时：节点位置会移动到原索引加上原容量的位置（newIndex = index + capacity）

这种数学特性意味着在遍历并重新分配原数组中的每个节点时，每个节点要么保持在原位置，要么移动到原位置加上旧容量的位置。这大大简化了扩容时对每个节点的重哈希过程。
    


## 最大容量的处理


Java 的HashMap虽然会自动扩容，但是是有最大容量限制的，其内部的数组长度不会超过2的30次方。不可调整。

static final int MAXIMUM_CAPACITY = 1 << 30; // 即 2^30 = 1,073,741,824

这个限制受限于Java中数组长度的最大长度（最大为 Integer.MAX_VALUE，即2的31次方减1）。 1<<30是一个合理的值，长度接近Integer.MAX_VALUE，又避免了各种计算的时候溢出的问题。

HashMap扩充时，容量已经达到或接近最大容量时，扩容的行为会受到限。
如果新容量已经达到 MAXIMUM_CAPACITY ，则不会进行扩容操作，threshold会被设置为 Integer.MAX_VALUE，以避免进一步扩容。

```java
if (oldCap >= MAXIMUM_CAPACITY) {
    threshold = Integer.MAX_VALUE;
    return oldTab;
}
```
