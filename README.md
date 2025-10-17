# Fast Base Convert

一个高性能的基数转换库，专为Linux系统优化。

## 特性

- 支持任意进制转换（2-65536）
- 多种优化策略：
  - 2的幂进制使用位运算
  - 小数字使用u128优化
  - 对齐进制使用分组转换
  - Linux系统特定优化
    - mmap超大数字优化
    - AVX2 SIMD指令加速
    - 内存对齐优化
    - 系统信息感知

## 性能

### 通用优化效果
- 小数字：**2.78倍**加速
- 2的幂进制：**6.12倍**加速

### Linux优化效果
- 中等数字(1024位)：**1450倍**加速
- 内存对齐优化：**2009倍**加速

## 使用

```rust
use fast_base_convert::{convert_base, convert_base_baseline};

// 基础转换
let input = vec![5, 4, 3, 2, 1]; // 12345 in base 10
let result = convert_base(&input, 10, 16);

// Linux系统信息
#[cfg(target_os = "linux")]
let (page_size, cores, numa) = fast_base_convert::get_linux_system_info();
```

## 运行测试

```bash
cargo test                    # 单元测试
cargo run --example benchmark    # 性能测试
cargo run --example linux_benchmark  # Linux优化测试
```

## 优化详情

### Linux特定优化

1. **mmap优化**：超大数字（>100k位）使用内存映射
2. **SIMD优化**：支持AVX2指令集的并行处理
3. **内存对齐**：64字节缓存行对齐
4. **系统感知**：基于sysconf的动态优化

## 许可证

MIT OR Apache-2.0