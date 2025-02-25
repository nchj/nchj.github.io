# java 线程通过 queue 实现线程间通讯

## 需求

一个很简单的需求：使用 java 创建两个线程，一个线程通过队列发送数字，另一个线程接收并输出这些数字。直到某个特殊值，二者退出

可以很容易的使用 java 的 BlockingQueue 实现这个需求， BlockingQueue 是一个阻塞队列，它支持两个附加操作：在队列为空时，获取元素的线程会等待队列变为非空；在队列满时，存储元素的线程会等待队列可用。

这道题目的重点是需要合理的关闭线程/线程池，以避免线程泄漏或者程序无法正常退出。

## 普通实现

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

public class GoroutineExample {

    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(10);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            // 生产者线程，发送数字
            executor.submit(() -> {
                try {
                    for (int i = 0; i < 5; i++) {
                        queue.put(i); // 发送数字到队列
                        System.out.println("Sent: " + i);
                    }
                    queue.put(-1); // 发送结束标志
                } catch (InterruptedException e) {
                    System.err.println("Producer interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt(); // 恢复中断状态，可选的，根据实际业务，一般是需要的
                }
            });

            // 消费者线程，接收并输出数字
            executor.submit(() -> {
                try {
                    while (true) {
                        int number = queue.take(); // 从队列中取出数字
                        if (number == -1) { // 检查是否结束
                            break;
                        }
                        System.out.println("Received: " + number);
                    }
                } catch (InterruptedException e) {
                    System.err.println("Consumer interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt(); // 恢复中断状态，可选的，根据实际业务，一般是需要的
                }
            });
        } finally {
            // 关闭线程池
            executor.shutdown();
            try {
                // 等待线程池中的任务完成，最多等待10秒
                if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                    System.err.println("Thread pool did not terminate in time, forcing shutdown.");
                    executor.shutdownNow(); // 强制关闭
                }
            } catch (InterruptedException e) {
                System.err.println("Shutdown interrupted: " + e.getMessage());
                executor.shutdownNow(); // 强制关闭
                Thread.currentThread().interrupt(); // 恢复中断状态
            }
        }
    }
}
```

## 利用 AutoCloseable 接口

Java 21 中 ExecutorService 接口继承了 AutoCloseable 接口，
所以可以使用 try-with-resources 语法使 Executor 在最后被自动地 close()

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

public class GoroutineExample {

    public static void main(String[] args) {
        // 创建一个容量为10的阻塞队列
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(10);

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            // 生产者线程，发送数字
            executor.submit(() -> {
                try {
                    for (int i = 0; i < 5; i++) {
                        queue.put(i); // 发送数字到队列
                        System.out.println("Sent: " + i);
                    }
                    queue.put(-1); // 发送结束标志
                } catch (InterruptedException e) {
                    System.err.println("Producer interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt(); // 恢复中断状态
                }
            });

            // 消费者线程，接收并输出数字
            executor.submit(() -> {
                try {
                    while (true) {
                        int number = queue.take(); // 从队列中取出数字
                        if (number == -1) { // 检查是否结束
                            break;
                        }
                        System.out.println("Received: " + number);
                    }
                } catch (InterruptedException e) {
                    System.err.println("Consumer interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt(); // 恢复中断状态
                }
            });
        }
    }
}
```

看看 AutoCloseable 接口的实现，可以看到做了自动重试机制，但是没有选择强制关闭线程池，只有用户手动 interrupt 的情况下才会强制关闭，这是一个比较好的实现，并且注意到，这个终止一定是通过 awaitTermination 退出的，而不是通过 shutdownNow 退出的

```java
    @Override
    default void close() {
        boolean terminated = isTerminated();
        if (!terminated) {
            shutdown();
            boolean interrupted = false;
            while (!terminated) {
                try {
                    terminated = awaitTermination(1L, TimeUnit.DAYS);
                } catch (InterruptedException e) {
                    if (!interrupted) {
                        shutdownNow();
                        interrupted = true;
                    }
                }
            }
            if (interrupted) {
                Thread.currentThread().interrupt();
            }
        }
    }
```

## 利用虚拟线程

当然，对于现代化的 java，也可以使用虚拟线程实现，这是一种更好的选择

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

public class VirtualThreadExample {

    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(10);

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();) {

            // 发送任务
            executor.submit(() -> {
                try {
                    for (int i = 0; i < 5; i++) {
                        queue.put(i);
                        System.out.println("Sent: " + i);
                    }
                    queue.put(-1); // 发送结束标志
                } catch (InterruptedException e) {
                    System.err.println("Sender interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt();
                }
            });

            // 接收任务
            executor.submit(() -> {
                try {
                    while (true) {
                        int number = queue.take();
                        if (number == -1) {
                            break;
                        }
                        System.out.println("Received: " + number);
                    }
                } catch (InterruptedException e) {
                    System.err.println("Receiver interrupted: " + e.getMessage());
                    Thread.currentThread().interrupt();
                }
            });
        }
    }
}
````
