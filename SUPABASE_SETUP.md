# Supabase 邮箱验证系统配置指南

## 问题修复说明

已修复以下问题：
1. ✅ 优化了邮箱验证失败的处理逻辑
2. ✅ 添加了重新发送确认邮件的功能
3. ✅ 改进了注册和登录的用户体验
4. ✅ 添加了更详细的错误提示
5. ✅ 修复了网络错误处理

## Supabase 控制台配置步骤

### 1. 登录 Supabase 控制台
1. 访问 https://supabase.com 并登录
2. 选择你的项目：`iyuqwappixlzveulkmhp`

### 2. 配置邮件验证（重要！）

#### 方案A：启用邮箱确认（推荐）
1. 在左侧菜单中点击 **Authentication** → **URL Configuration**
2. 找到 **Confirm email** 选项，确保**已启用**（显示为绿色）
3. 设置 **Site URL**：你的网站地址（例如：`https://你的网站.netlify.app`）
4. 点击 **Save**

#### 方案B：禁用邮箱确认（用于测试）
> ⚠️ 仅建议开发测试时使用，不推荐生产环境

1. 在左侧菜单中点击 **Authentication** → **Providers** → **Email**
2. 找到 **Confirm email** 选项，**禁用**它
3. 点击 **Save**

### 3. 配置邮件模板（可选）

1. 进入 **Authentication** → **Email Templates**
2. 自定义验证邮件的：
   - 邮件标题
   - 邮件内容
   - 邮件 LOGO 等

### 4. 检查 RLS 策略（重要！）

#### 检查 user_profiles 表的 RLS 策略
1. 进入 **Database** → **Tables**
2. 找到 `user_profiles` 表，点击查看详情
3. 点击 **Policies** 检查 RLS 策略
4. 确保有以下策略（或者根据需要调整）：

```sql
-- 允许用户查看和编辑自己的资料
CREATE POLICY "用户可以查看自己的资料" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "用户可以编辑自己的资料" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "用户可以创建自己的资料" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
```

#### 检查 websites 表的 RLS 策略
1. 进入 **Database** → **Tables**
2. 找到 `websites` 表，点击查看详情
3. 点击 **Policies** 检查 RLS 策略
4. 确保有以下策略：

```sql
-- 允许所有人查看网站列表（必须！）
CREATE POLICY "允许所有人查看网站" 
ON websites FOR SELECT 
USING (true);

-- 允许管理员插入网站
CREATE POLICY "管理员可以添加网站" 
ON websites FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND email = '2706273423@qq.com'
  )
);

-- 允许管理员删除网站
CREATE POLICY "管理员可以删除网站" 
ON websites FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND email = '2706273423@qq.com'
  )
);
```

### 5. 启用网站表实时订阅

1. 进入 **Database** → **Tables**
2. 找到 `websites` 表
3. 确保 **Enable Realtime** 选项已开启

## 常见问题排查

### Q1: 注册后收不到验证邮件？
**解决方案：**
1. 检查垃圾邮件文件夹
2. 在 Supabase 控制台检查邮件发送记录（Monitoring → Logs）
3. 确认邮件模板配置正确

### Q2: 提示 "Email not confirmed" 但我已经确认了？
**解决方案：**
1. 清除浏览器缓存和 Cookie
2. 重新登录
3. 检查 Supabase 中的用户确认状态

### Q3: 登录显示 "Invalid credentials"？
**解决方案：**
1. 确认邮箱和密码正确
2. 确认邮箱已验证
3. 检查是否被锁定（频繁请求）

### Q4: 添加网站时显示没有权限？
**解决方案：**
1. 确认使用的是管理员邮箱：`2706273423@qq.com`
2. 检查 websites 表的 RLS 策略是否正确
3. 确认在 user_profiles 表中有该管理员的资料

## 测试流程

1. ✅ 打开网站首页
2. ✅ 尝试注册一个新邮箱
3. ✅ 检查邮箱确认邮件
4. ✅ 点击确认链接
5. ✅ 尝试登录
6. ✅ 管理员登录后测试添加网站
7. ✅ 验证网站列表正常显示

## 联系支持

如果以上方法都不能解决问题：
1. 检查浏览器控制台错误信息（F12 → Console）
2. 截图错误信息
3. 检查 Supabase 控制台日志
