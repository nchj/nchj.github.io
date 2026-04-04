# Java线程的六种状态

Java中线程的状态分为6种：
1. NEW：新创建了一个线程对象，但还没有调用start()方法。
2. RUNNABLE：Java线程中将就绪（ready）和运行中（running）两种状态笼统的称为“RUNNABLE”。线程对象创建后，调用了该对象的start()方法。该状态的线程位于可运行线程池中，等待被线程调度选中，获取CPU的使用权，此时处于就绪状态（ready）。就绪状态的线程在获得CPU时间片后变为运行中状态（running）。
3. BLOCKED：表示线程阻塞于锁，例如处于synchronized同步代码块或者方法中被阻塞
4. WAITING：进入该状态的线程需要等待其他线程做出一些特定动作（通知或中断）。下列不带超时的方式：Object.wait 、 Thread.join 、 LockSupport.park
5. TIMED_WAITING：该状态不同于WAITING，它可以在指定的时间后自行返回。下列带超时的方式：Thread.sleep 、 Object.wait 、 Thread.join 、 LockSupport.parkNanos 、LockSupport.parkUntiI
6. TERMINATED：表示该线程已经执行完毕。

# 安全停止线程
stop() 和 interrupt() 方法

stop() 方法会真的杀死线程，不给予任何其他运行的机会，如果线程持有 ReentrantLock 锁，被 stop() 的线程并不会自动调用 ReentrantLock 的 unlock() 去释放锁。

类似的方法还有 suspend() 和 resume() 方法。因此，stop, suspend,resume都被弃用了。

interrupt() 方法仅仅是通知线程，线程有机会执行一些后续操作，同时也可以无视这个通知。可以用isInterrupt()方法检测自己是否被Interrupt。如果目标线程在调用 Object class 的 wait() 、 wait(long) 或 wait(long, int) 方法、 join() 、join(long, int) 或 sleep(long, int ）方法时被interrupt()，那么 lnterrupt 会生效，该线程的中断状态将被清除，抛出 lnterruptedException 异常。
