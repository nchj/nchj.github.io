---
Title: Java线程池
Date: 2023-08-28 22:29:00
Tags: [Java, 多线程, 线程池]
---

# why use thread pool

1. 降低资源消耗。通过重复利用已创建的线程降低线程创建和销毁造成的消耗，包括时间消耗和内存消耗。
2. 提高响应速度。当任务到达时，任务可以不需要等到线程创建就能立即执行。
3. 提高线程的可管理性。线程是稀缺资源，如果无限制的创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配、调优和监控。

# concept

1. 线程池管理器（ThreadPool）：用于创建并管理线程池，包括创建线程池，销毁线程池，添加新任务；
2. 工作线程（PoolWorker）：线程池中线程，在没有任务时处于等待状态，可以循环的执行任务；
3. 任务接口（Task）：每个任务必须实现的接口，以供工作线程调度任务的执行，它主要规定了任务的入口，任务执行完后的收尾工作，任务的执行状态等；
4. 任务队列（taskQueue）：用于存放没有处理的任务。提供一种缓冲机制。

# interface and implement

- Executor
  - type: interface
  - description: 执行器，定义了一个 execute 方法，用来执行任务
- ExecutorService
  - type: interface
  - description: 扩展了 Executor 接口，提供了 Callable 和 Future 和状态查询等的支持
- ScheduledExecutorService
  - type: interface
  - description: 扩展了 ExecutorService 接口，提供了定时任务的支持
- AbstractExecutorService
  - type: class
  - description: 实现了 ExecutorService 接口
- ThreadPoolExecutor
  - type: class
  - description: 实现了 AbstractExecutorService，是基础且标准的线程池实现类
- ScheduledThreadPoolExecutor
  - type: class
  - description: 实现了 ScheduledExecutorService 接口，是定时任务的核心实现类

## ExecutorService interface

含有以下接口

![ExecutorService interface methods](/assets/ExecutorService_interface.png)

顾名思义，不做过多介绍，详情可以见 javadoc 或者 jdk 源码

## ScheduledExecutorService interface

![ScheduledExecutorService interface methods](/assets/ScheduledExecutorService_interface.png)

- schedule
  - args: Runnable commad, long delay, TimeUnit unit
  - return: ScheduledFuture<?>
  - description: 创建并执行在给定延迟后启用的一次性操作
- schedule
  - args: Callable<V> callable, long delay, TimeUnit unit
  - return: ScheduledFuture<V>
  - description: 创建并执行在给定延迟后启用的 ScheduledFuture
- **scheduleAtFixedRate**
  - args: Runnable command, long initialDelay, long delay, TimeUnit unit
  - return: ScheduledFuture<?>
  - description: 创建并执行在给定初始延迟后首次启用的定期操作，固定速率，也即以固定速率到达一个新任务，如果上一个任务还没执行完就来了新任务，那么上一个任务执行完之后直接执行下个任务，无需延迟
- **scheduleWithFixedDelay**
  - args: Runnable command, long initialDelay, long delay, TimeUnit unit
  - return: ScheduledFuture<?>
  - description: 创建并执行在给定初始延迟后首次启用的定期操作，固定延迟，即无论如何，只有上一个任务结束后，再过一个延时才会执行

## ThreadPoolExecutor class

TODO: 里面有很多参数和处理细节，暂不讨论

线程池新加入任务的处理流程

![线程池新加入任务的处理流程](/assets/ThreadPool_new_task_flow.png)

# Executors class

Executors 是一个工具类，提供了一些静态方法，可以方便的创建线程池
常用的有以下几个方法

- newFixedThreadPool
  - args: int nThreads
  - return: ExecutorService
  - description: 创建一个固定大小的线程池，任务队列无限，核心线程数=最大线程数=nThreads，每次提交一个任务就创建一个线程，直到达到线程池的最大数量，这时线程数量不再变化，当线程发生未预期的错误而结束时，线程池会补充一个新线程
- newCachedThreadPool
  - args: none
  - return: ExecutorService
  - description: 创建一个可缓存的线程池，如果线程池的大小超过了处理任务所需要的线程，那么就会回收部分空闲的线程，当任务数增加时，此线程池又可以添加新线程来处理任务，线程池的规模为 Interger.MAX_VALUE
- newSingleThreadExecutor
  - args: none
  - return: ExecutorService
  - description: 创建一个单线程化的线程池，任务队列无限，它只会用唯一的工作线程来执行任务，保证所有任务按照指定顺序执行，类似于 fixedThreadPool(1)
- newScheduledThreadPool
  - args: int corePoolSize
  - return: ScheduledExecutorService
  - description: 创建一个定长的线程池，支持定时及周期性任务执行，最大线程数为 Integer.MAX_VALUE

argue:最好不使用 Executors 创建线程池，因为 Executors 提供的线程池有很多弊端，可参见[Java 线程池的核心线程数和最大线程数总是容易混淆怎么办](https://zhuanlan.zhihu.com/p/112527671)

- fixedThreadPool 和 singleThreadExecutor 允许的请求队列长度为 Integer.MAX_VALUE，可能会堆积大量的请求，从而导致 OOM
- cachedThreadPool 和 scheduledThreadPool 允许的创建线程数量为 Integer.MAX_VALUE，可能会创建大量的线程，从而导致 OOM

