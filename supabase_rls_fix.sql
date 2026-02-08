-- ============================================================================
-- Supabase RLS 策略修复脚本
-- 运行此脚本在 Supabase 的 SQL 编辑器中
-- ============================================================================

-- 1. 启用 RLS（如果尚未启用）
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- 2. 删除现有的策略（如果有冲突的）
DROP POLICY IF EXISTS "允许匿名用户读取网站" ON public.websites;
DROP POLICY IF EXISTS "允许所有用户读取网站" ON public.websites;
DROP POLICY IF EXISTS "允许用户创建个人资料" ON public.user_profiles;
DROP POLICY IF EXISTS "允许用户更新自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "允许管理员管理网站" ON public.websites;

-- 3. 创建 user_profiles 表的策略
-- 3.1 允许任何认证用户读取用户资料（用于显示用户信息）
CREATE POLICY "允许认证用户读取所有用户资料"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- 3.2 允许用户创建自己的个人资料
CREATE POLICY "允许用户创建自己的资料"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3.3 允许用户更新自己的个人资料
CREATE POLICY "允许用户更新自己的资料"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. 创建 websites 表的策略
-- 4.1 允许所有访问者（包括匿名）读取网站列表
CREATE POLICY "允许所有人读取网站"
ON public.websites
FOR SELECT
TO anon, authenticated
USING (true);

-- 4.2 只允许管理员（2706273423@qq.com）插入网站
-- 这里我们通过函数检查用户邮箱
CREATE POLICY "允许管理员插入网站"
ON public.websites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND email = '2706273423@qq.com'
  )
);

-- 4.3 只允许管理员更新网站
CREATE POLICY "允许管理员更新网站"
ON public.websites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND email = '2706273423@qq.com'
  )
);

-- 4.4 只允许管理员删除网站
CREATE POLICY "允许管理员删除网站"
ON public.websites
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND email = '2706273423@qq.com'
  )
);

-- 5. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_websites_category ON public.websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON public.websites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- 6. 验证策略创建成功
SELECT
  tablename,
  policyname,
  perm,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. 创建函数用于检查是否是管理员
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND email = '2706273423@qq.com'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS '检查当前用户是否是管理员';

-- 提示信息
SELECT 'RLS策略配置完成！请检查上面的策略列表是否正确创建。' AS status;
SELECT '管理员邮箱: 2706273423@qq.com' AS admin_info;
