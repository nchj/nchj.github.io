---
Title: Hyper-V 配置GPU分区
Dae: 2025-08-13
---

文章参考自：<https://oxdl.cn/post/843/>

根据自用需求进行了简化。删除了一些无用的内容

## 背景

Hyper-v 支持为虚拟机配置 GPU，且一张 GPU 可以在多个虚拟机之间共享。
该功能默认只在商用平台有，NV 驱动在消费平台上屏蔽了这一功能，但是经过实验确认可以在消费级平台实现。

其原理是手动复制宿主机上已经安装好的显卡驱动文件到指定的位置。

## 系统要求

宿主机和虚拟机都使用较新的 windows 操作系统，我的宿主机使用的是 Win11，虚拟机使用的是 win10，实测可以。

网传有一个简单的判断标准：win+r 运行 dxdiag，显示-驱动程序-驱动程序模型：WDDM 版本 ≥2.7 即可。

但是实际运行来看最好是要保证宿主机和虚拟机的系统版本一致。

## 安装和配置虚拟机

1. 根据正常操作流程安装 Hyper-V 虚拟机。
2. **关闭虚拟机的检查点功能**，以后也不要启用检查点功能。
3. 用管理员权限打开 PowerShell，运行下面的命令。

```pwsh
$vm = "你的虚拟机名称"

Remove-VMGpuPartitionAdapter -VMName $vm
Add-VMGpuPartitionAdapter -VMName $vm
Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionVRAM 1
Set-VMGpuPartitionAdapter -VMName $vm -MaxPartitionVRAM 11
Set-VMGpuPartitionAdapter -VMName $vm -OptimalPartitionVRAM 10
Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionEncode 1
Set-VMGpuPartitionAdapter -VMName $vm -MaxPartitionEncode 11
Set-VMGpuPartitionAdapter -VMName $vm -OptimalPartitionEncode 10
Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionDecode 1
Set-VMGpuPartitionAdapter -VMName $vm -MaxPartitionDecode 11
Set-VMGpuPartitionAdapter -VMName $vm -OptimalPartitionDecode 10
Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionCompute 1
Set-VMGpuPartitionAdapter -VMName $vm -MaxPartitionCompute 11
Set-VMGpuPartitionAdapter -VMName $vm -OptimalPartitionCompute 10
Set-VM -GuestControlledCacheTypes $true -VMName $vm
Set-VM -LowMemoryMappedIoSpace 1Gb -VMName $vm
Set-VM -HighMemoryMappedIoSpace 32GB -VMName $vm
Start-VM -Name $vm
```

如果你了解这些参数的意思，可以手动根据自己的需求调整参数。

运行完成之后等待虚拟机开机，连接上之后进入设备管理器查看显卡是否已经能被识别，此时虚拟机的显卡设备上有个感叹号是正常的。

## 安装虚拟机内的显卡驱动

由于 Nvidia 屏蔽了家用显卡的虚拟化功能，所以此时虽然已经可以在设备管理器看到显卡已被正确识别，但仍然无法安装驱动，必须要手动复制宿主机的以下驱动文件到虚拟机上。

1. 将宿主机的 `C:\Windows\System32\nvapi64.dll` 复制到虚拟机的 `C:\Windows\System32\nvapi64.dll` 文件夹。
2. 在虚拟机创建`C:\Windows\System32\HostDriverStore\FileRepository`文件夹。
3. 在宿主机里打开设备管理器找到显卡-驱动-驱动程序详细信息。
   在驱动文件的列表中，拉到最下面，可以找到一个 nv 开头的文件夹，这个文件夹名字不是固定的，所以得肉眼分辨。
4. 把宿主机的`C:\Windows\System32\DriverStore\FileRepository\你肉眼找到的 nv 开头的显卡驱动文件夹`复制到虚拟机上面刚创建的 `C:\Windows\System32\HostDriverStore\FileRepository` 文件夹内，
5. 重启虚拟机，打开设备管理器可以看到显卡已经可以正确识别并工作了，运行 dxdiag，在呈现一栏可以再检查一下设备是否正常运转

## 驱动更新

每次宿主机更新显卡驱动后，虚拟机内的显卡又会处于不可用的状态，需要重新执行安装虚拟机内的显卡驱动这一节。
