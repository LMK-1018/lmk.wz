// 修复版 - Supabase邮箱验证系统
(function() {
    // Supabase配置
    const supabaseUrl = window.env?.SUPABASE_URL || 'https://iyuqwappixlzveulkmhp.supabase.co';
    const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY || 'sb_publishable_VG_J4mJSXv3SJwQX6LiXGg_mLaK9TOr';
    
    // 管理员邮箱常量
    const ADMIN_EMAIL = '2706273423@qq.com';

    // 初始化Supabase客户端
    let supabaseClient = null;
    let supabase = null;
    
    function initSupabase() {
        if (!window.supabaseClient) {
            if (window.supabase) {
                try {
                    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                    supabaseClient = window.supabaseClient;
                    supabase = window.supabaseClient;
                    return true;
                } catch (error) {
                    console.error('Supabase初始化失败:', error);
                    return false;
                }
            } else {
                console.error('Supabase库未加载，请检查网络连接');
                return false;
            }
        } else {
            supabaseClient = window.supabaseClient;
            supabase = window.supabaseClient;
            return true;
        }
    }

    // DOM元素获取
    const authScreen = document.getElementById('auth-screen');
    const mainContent = document.getElementById('main-content');
    const authTabBtns = document.querySelectorAll('.auth-tab-btn');
    const authFormContainers = document.querySelectorAll('.auth-form-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const rememberMe = document.getElementById('remember-me');

    const pages = document.querySelectorAll('.page');

    const userAvatar = document.getElementById('user-avatar');
    const avatarUpload = document.getElementById('avatar-upload');
    const userName = document.getElementById('user-name');
    const saveNameBtn = document.getElementById('save-name');

    const addWebsiteBtn = document.getElementById('add-website-btn');
    const addWebsiteModal = document.getElementById('add-website-modal');
    const addWebsiteForm = document.getElementById('add-website-form');
    const cancelAddBtn = document.getElementById('cancel-add');
    const addError = document.getElementById('add-error');
    const websitesList = document.getElementById('websites-list');
    const emptyState = document.getElementById('empty-state');

    // 创建登出按钮
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '退出';
    logoutBtn.className = 'logout-btn';
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: #333;
        font-family: inherit;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99;
    `;
    logoutBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.2)';
        this.style.transform = 'translateY(-2px)';
    });
    logoutBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.1)';
        this.style.transform = 'translateY(0)';
    });
    document.body.appendChild(logoutBtn);

    // 存储键名常量
    const STORAGE_KEYS = {
        CURRENT_USER: 'personal_website_current_user',
        REMEMBERED_USER: 'personal_website_remembered_user',
        USER_AVATAR: 'personal_website_user_avatar',
        USER_NAME: 'personal_website_user_name',
        PENDING_CONFIRMATION: 'personal_website_pending_confirmation'
    };

    // 检查是否是管理员
    function isAdminEmail(email) {
        return email === ADMIN_EMAIL;
    }

    // 显示错误提示
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.textContent = '';
        }, 5000);
    }

    // 显示成功提示
    function showSuccess(message) {
        alert(message);
    }

    // 初始化数据
    async function initData() {
        // 检查记住的用户
        const rememberedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.REMEMBERED_USER));
        if (rememberedUser) {
            document.getElementById('login-email').value = rememberedUser.email || rememberedUser.username;
            document.getElementById('login-password').value = rememberedUser.password;
            rememberMe.checked = true;
        }
        
        // 检查是否有待确认的注册
        const pendingConfirmation = localStorage.getItem(STORAGE_KEYS.PENDING_CONFIRMATION);
        if (pendingConfirmation) {
            const pending = JSON.parse(pendingConfirmation);
            showSuccess(`您之前注册的邮箱 ${pending.email} 正在等待确认，请前往邮箱确认验证邮件`);
        }
        
        // 初始化Supabase
        if (!initSupabase()) {
            console.warn('Supabase初始化失败，将使用本地模式');
            return;
        }
        
        // 检查当前用户是否已登录
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await handleLoggedInUser(user);
            }
        } catch (error) {
            console.log('获取用户状态失败:', error.message);
        }
    }

    // 处理已登录用户
    async function handleLoggedInUser(user) {
// 获取用户信息
        let username = user.email?.split('@')[0] || user.id;
        let isAdmin = isAdminEmail(user.email);
        
        // 尝试从user_profiles获取用户名
        try {
            const { data: userProfile, error: profileError } = await supabase
                .from('user_profiles')
                .select('username, email')
                .eq('id', user.id)
                .single();
            
            if (!profileError && userProfile) {
                username = userProfile.username || username;
                if (userProfile.email === ADMIN_EMAIL) {
                    isAdmin = true;
                }
            }
        } catch (profileErr) {
            console.log('无法获取用户资料:', profileErr.message);
        }
        
        const currentUser = {
            id: user.id,
            username: username,
            email: user.email,
            isAdmin: isAdmin
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }

    // 登录注册切换
    authTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const authType = btn.getAttribute('data-auth-type');
            
            // 更新标签
            authTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新表单
            authFormContainers.forEach(container => {
                container.classList.remove('active');
            });
            document.getElementById(`${authType}-form-container`).classList.add('active');
            
            // 清空错误信息
            loginError.textContent = '';
            registerError.textContent = '';
        });
    });

    // 创建用户资料（带错误处理）
    async function createUserProfile(userId, username, email) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    username: username,
                    email: email
                });
            
            if (error) {
                // 检查是否是RLS错误
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    console.log('无法创建用户资料（RLS策略限制），这可能是正常的: ' + error.message);
                    return { success: false, isRLSError: true };
                }
                console.error('创建用户资料失败:', error);
                return { success: false, error };
            }
            
            console.log('用户资料创建成功');
            return { success: true, data };
        } catch (err) {
            console.error('创建用户资料时发生异常:', err);
            return { success: false, error: err };
        }
    }

    // 重新发送确认邮件
    async function resendConfirmationEmail(email) {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            
            if (error) {
                showError(registerError, '重发确认邮件失败: ' + error.message);
                return false;
            }
            
            showSuccess(`确认邮件已重新发送至 ${email}，请查收`);
            return true;
        } catch (error) {
            console.error('重发确认邮件时发生错误:', error);
            showError(registerError, '重发确认邮件失败，请稍后再试');
            return false;
        }
    }

    // 注册功能 - 修复版
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // 表单验证
        if (password !== confirmPassword) {
            showError(registerError, '两次输入的密码不一致');
            return;
        }
        
        if (password.length < 6) {
            showError(registerError, '密码长度不能少于6位');
            return;
        }
        
        if (!email.includes('@')) {
            showError(registerError, '请输入有效的邮箱地址');
            return;
        }
        
        // 检查是否是管理员邮箱
        const isAdmin = isAdminEmail(email);
        if (isAdmin) {
            showError(registerError, '此邮箱为管理员专用，请使用其他邮箱注册');
            return;
        }
        
        // 禁用注册按钮，防止重复提交
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';
        
        try {
            // 使用Supabase邮箱注册
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) {
                // 处理频繁请求错误
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    showError(registerError, '请求过于频繁，请稍后再试');
                } else if (error.message.includes('User already registered') || error.message.includes('already been taken')) {
                    showError(registerError, '该邮箱已被注册，请直接登录或使用其他邮箱');
                } else {
                    showError(registerError, '注册失败: ' + error.message);
                }
                return;
            }
            
            if (data.user) {
                // 检查是否需要确认邮箱
                // Supabase返回user但session为null时，通常需要邮箱确认
                if (data.session === null) {
                    // 保存待确认状态
                    localStorage.setItem(STORAGE_KEYS.PENDING_CONFIRMATION, JSON.stringify({
                        email: email,
                        username: username,
                        timestamp: new Date().toISOString()
                    }));
                    
                    // 提示用户确认邮箱
                    showSuccess('注册成功！请前往邮箱确认验证邮件。\n\n如果没收到邮件，请检查垃圾邮件文件夹。\n点击确定后可以重新发送确认邮件。');
                    
                    // 添加重新发送选项
                    const resendConfirm = confirm('是否需要重新发送确认邮件？');
                    if (resendConfirm) {
                        await resendConfirmationEmail(email);
                    }
                    
                    // 切换到登录界面
                    document.querySelector('[data-auth-type="login"]').click();
                    return;
                }
                
                // 如果有session（邮箱确认已禁用），直接登录
                await handleLoggedInUser(data.user);
                
                // 创建用户资料
                await createUserProfile(data.user.id, username, email);
                
                const currentUser = {
                    id: data.user.id,
                    username: username,
                    email: email,
                    isAdmin: isAdmin
                };
                
                // 执行登录
                loginUser(currentUser);
            }
        } catch (error) {
            console.error('注册时发生错误:', error);
            showError(registerError, '注册失败: 网络错误，请检查网络连接');
        } finally {
            // 重新启用注册按钮
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
        }
    });

    // 登录功能 - 修复版
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // 基础验证
        if (!email || !password) {
            showError(loginError, '请输入邮箱和密码');
            return;
        }
        
        // 检查是否是管理员邮箱
        const isAdmin = isAdminEmail(email);
        
        // 禁用登录按钮，防止重复提交
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        
        try {
            // 使用Supabase邮箱登录
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                // 处理邮箱未确认的情况
                if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
                    showError(loginError, '请先前往邮箱确认验证邮件，然后再登录。\n如果没收到邮件，请检查垃圾邮件文件夹。');
                    
                    const resendConfirm = confirm('是否需要重新发送确认邮件？');
                    if (resendConfirm) {
                        await resendConfirmationEmail(email);
                    }
                    return;
                }
                
                // 处理频繁请求错误
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    showError(loginError, '请求过于频繁，请稍后再试');
                    return;
                }
                
                // 处理无效凭证错误
                if (error.message.includes('Invalid') || error.message.includes('credentials')) {
                    showError(loginError, '邮箱或密码错误，请检查输入');
                    return;
                }
                
                showError(loginError, '登录失败: ' + error.message);
                return;
            }
            
            if (data.user) {
                // 获取用户个人资料
                let username = email.split('@')[0];
                let userIsAdmin = isAdmin;
                
                try {
                    const { data: userProfile, error: profileError } = await supabase
                        .from('user_profiles')
.select('username, email')
                        .eq('id', data.user.id)
                        .single();
                    
                    if (!profileError && userProfile) {
                        username = userProfile.username || username;
                        if (userProfile.email === ADMIN_EMAIL) {
                            userIsAdmin = true;
                        }
                    }
                } catch (profileErr) {
                    console.log('无法获取用户资料:', profileErr.message);
                }
                
                const currentUser = {
                    id: data.user.id,
                    username: username,
                    email: email,
                    isAdmin: userIsAdmin
                };
                
                // 记住密码
                if (rememberMe.checked) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBERED_USER, JSON.stringify({
                        email,
                        password
                    }));
                } else {
                    localStorage.removeItem(STORAGE_KEYS.REMEMBERED_USER);
                }
                
                // 清除待确认状态
                localStorage.removeItem(STORAGE_KEYS.PENDING_CONFIRMATION);
                
                loginUser(currentUser);
            }
        } catch (error) {
            console.error('登录时发生错误:', error);
            showError(loginError, '登录失败: 网络错误，请检查网络连接');
        } finally {
            // 重新启用登录按钮
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    });

    // 登录用户函数
    async function loginUser(user) {
        // 保存当前用户
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        
        // 显示主内容，隐藏登录界面
        authScreen.classList.remove('active');
        setTimeout(async () => {
            authScreen.style.display = 'none';
            mainContent.classList.add('active');
            mainContent.style.display = 'block';
            
            // 初始化用户信息
            initUserInfo();
            
            // 初始化网站列表
            await renderWebsites();
            
            // 检查权限
            checkPermissions(user);
            
            // 显示登出按钮
            logoutBtn.style.display = 'block';
            
            // 清空错误信息
            loginError.textContent = '';
            registerError.textContent = '';
        }, 300);
    }

    // 检查登录状态
    async function checkLoginStatus() {
        // 先检查本地存储
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        
        // 如果Supabase不可用，使用本地存储的用户信息
        if (!supabase) {
            if (currentUser) {
                authScreen.style.display = 'none';
                mainContent.classList.add('active');
                mainContent.style.display = 'block';
                
                initUserInfo();
                await renderWebsites();
                checkPermissions(currentUser);
                logoutBtn.style.display = 'block';
            } else {
                authScreen.classList.add('active');
                authScreen.style.display = 'flex';
                mainContent.classList.remove('active');
                mainContent.style.display = 'none';
                logoutBtn.style.display = 'none';
            }
            return;
        }
        
        try {
            // 检查Supabase中的用户状态
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // 用户已登录
                authScreen.style.display = 'none';
                mainContent.classList.add('active');
                mainContent.style.display = 'block';
                
                initUserInfo();
                await renderWebsites();
                checkPermissions(currentUser || { isAdmin: isAdminEmail(user.email) });
                logoutBtn.style.display = 'block';
            } else if (currentUser) {
                // 本地有用户信息但Supabase没有，可能需要重新登录
                console.log('本地有用户信息但Supabase会话已过期');
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                
                authScreen.classList.add('active');
                authScreen.style.display = 'flex';
                mainContent.classList.remove('active');
                mainContent.style.display = 'none';
                logoutBtn.style.display = 'none';
            } else {
                // 用户未登录
                authScreen.classList.add('active');
                authScreen.style.display = 'flex';
                mainContent.classList.remove('active');
                mainContent.style.display = 'none';
                logoutBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('检查登录状态时发生错误:', error);
            // 如果出错但本地有用户信息，保持登录状态
            if (currentUser) {
                authScreen.style.display = 'none';
                mainContent.classList.add('active');
                mainContent.style.display = 'block';
                
                initUserInfo();
                await renderWebsites();
                checkPermissions(currentUser);
                logoutBtn.style.display = 'block';
            }
        }
    }

    // 登出功能
    logoutBtn.addEventListener('click', async () => {
        try {
            // 使用Supabase登出
            if (supabase) {
                await supabase.auth.signOut();
            }
            // 清除本地存储
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(STORAGE_KEYS.REMEMBERED_USER);
            localStorage.removeItem(STORAGE_KEYS.PENDING_CONFIRMATION);
            await checkLoginStatus();
        } catch (error) {
            console.error('登出时发生错误:', error);
            // 即使出错也要清除本地状态
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(STORAGE_KEYS.REMEMBERED_USER);
            localStorage.removeItem(STORAGE_KEYS.PENDING_CONFIRMATION);
            await checkLoginStatus();
        }
    });

    // 页面切换
    const navbarBtns = document.querySelectorAll('.navbar-btn');
    navbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.getAttribute('data-page');
            
            // 更新Navbar
            navbarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新页面
            pages.forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(targetPage).classList.add('active');
        });
    });

    // 初始化用户信息
    function initUserInfo() {
        // 加载头像
        const savedAvatar = localStorage.getItem(STORAGE_KEYS.USER_AVATAR);
        if (savedAvatar) {
            userAvatar.src = savedAvatar;
        }
        
        // 加载名称
        const savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        if (savedName) {
            userName.value = savedName;
        }
    }

    // 头像上传
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgSrc = event.target.result;
                userAvatar.src = imgSrc;
                localStorage.setItem(STORAGE_KEYS.USER_AVATAR, imgSrc);
            };
            reader.readAsDataURL(file);
        }
    });

    // 保存用户名称
    saveNameBtn.addEventListener('click', () => {
        const name = userName.value.trim();
        if (name) {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
            showSuccess('名称已保存');
        }
    });

    // 检查权限
    function checkPermissions(user) {
        if (user.isAdmin) {
            // 管理员权限，显示添加网址按钮
            addWebsiteBtn.style.display = 'flex';
        } else {
            // 普通用户权限，隐藏添加网址按钮
            addWebsiteBtn.style.display = 'none';
        }
    }

    // 添加网址按钮点击事件
    addWebsiteBtn.addEventListener('click', () => {
        addWebsiteModal.classList.add('active');
    });

    // 取消添加
    cancelAddBtn.addEventListener('click', () => {
        addWebsiteModal.classList.remove('active');
        addWebsiteForm.reset();
        addError.textContent = '';
    });

    // 关闭模态框（点击背景）
    addWebsiteModal.addEventListener('click', (e) => {
        if (e.target === addWebsiteModal) {
            cancelAddBtn.click();
        }
    });

    // 添加网址表单提交
    addWebsiteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = document.getElementById('website-url').value.trim();
        const description = document.getElementById('website-description').value.trim();
        const category = document.getElementById('website-category').value.trim();
        
        // 表单验证
        if (!url) {
            showError(addError, '请输入网页网址');
            return;
        }
        
        if (!description) {
            showError(addError, '请输入功能描述');
            return;
        }
        
        if (!category) {
            showError(addError, '请选择分类');
            return;
        }
        
        try {
            // 使用Supabase添加网站
            const { error } = await supabase
                .from('websites')
                .insert({
                    url: url,
                    description: description,
                    category: category
                });
            
            if (error) {
                console.error('添加网站失败:', error);
                // 检查是否是权限错误
                if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy')) {
                    showError(addError, '添加网站失败: 您没有管理员权限');
                } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    showError(addError, '添加网站失败: websites表不存在，请联系管理员');
                } else {
                    showError(addError, '添加网站失败: ' + error.message);
                }
                return;
            }
            
            // 重新渲染网站列表
            await renderWebsites();
            
            // 关闭模态框
            cancelAddBtn.click();
            
            showSuccess('网站添加成功');
        } catch (error) {
            console.error('添加网站时发生错误:', error);
            showError(addError, '添加网站失败: 网络错误');
        }
    });

    // 渲染网站列表
    async function renderWebsites() {
        if (!supabase) {
            console.warn('Supabase不可用，无法加载网站列表');
            emptyState.innerHTML = '<p>网站列表暂不可用，请检查网络连接</p>';
            emptyState.style.display = 'block';
            websitesList.style.display = 'none';
            return;
        }
        
        try {
            // 使用Supabase获取所有网站数据
            const { data: websites, error } = await supabase
                .from('websites')
                .select('*')
                .order('created_at', { ascending: false });
            
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            
            if (error) {
                console.error('获取网站数据失败:', error);
                // 检查是否是表不存在的错误
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.error('websites表不存在，请在Supabase控制台中创建该表');
                    emptyState.innerHTML = `
                        <p>网站列表暂不可用</p>
                        <p>请在Supabase控制台中创建websites表</p>
                        <p style="font-size: 0.8em; color: #666;">错误详情: ${error.message}</p>
                    `;
                } else if (error.code === '42501' || error.message.includes('row-level security')) {
                    console.error('访问网站列表被RLS策略限制');
                    emptyState.innerHTML = '<p>网站列表加载失败，请刷新页面重试</p>';
                } else {
                    console.error('获取网站数据失败:', error);
                    emptyState.innerHTML = '<p>网站列表加载失败，请刷新页面重试</p>';
                }
                websitesList.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }
            
            if (!websites || websites.length === 0) {
                websitesList.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }
            
            websitesList.style.display = 'block';
            emptyState.style.display = 'none';
            
            // 清空现有列表
            websitesList.innerHTML = '';
            
            // 创建分类容器
            const categoriesContainer = document.createElement('div');
            categoriesContainer.className = 'categories-container';
            websitesList.appendChild(categoriesContainer);
            
            // 按分类分组网站
            const categories = ['学习', '游戏', '工具'];
            const groupedWebsites = {};
            
            // 初始化分组
            categories.forEach(category => {
                groupedWebsites[category] = [];
            });
            
            // 将网站分配到对应分组
            websites.forEach(website => {
                const category = website.category || '未分类';
                if (groupedWebsites[category]) {
                    groupedWebsites[category].push(website);
                } else {
                    groupedWebsites[category] = [website];
                }
            });
            
            // 按分类渲染网站
            categories.forEach(category => {
                const categoryWebsites = groupedWebsites[category];
                if (categoryWebsites.length > 0) {
                    // 创建分类章节
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    
                    // 创建分类标题
                    const categoryTitle = document.createElement('h3');
                    categoryTitle.className = 'category-title';
                    categoryTitle.textContent = category;
                    categorySection.appendChild(categoryTitle);
                    
                    // 创建分类网站列表
                    const categoryList = document.createElement('div');
                    categoryList.className = 'category-websites';
                    
                    // 渲染该分类下的网站
                    categoryWebsites.forEach(website => {
                        const websiteItem = document.createElement('div');
                        websiteItem.className = 'website-item';
                        websiteItem.innerHTML = `
                            ${currentUser?.isAdmin ? `<button class="delete-btn" data-id="${website.id}">×</button>` : ''}
                            <a href="${website.url}" class="website-url" target="_blank" rel="noopener noreferrer">
                                ${website.url}
                            </a>
                            <p class="website-description">${website.description}</p>
                        `;
                        categoryList.appendChild(websiteItem);
                    });
                    
                    categorySection.appendChild(categoryList);
                    categoriesContainer.appendChild(categorySection);
                }
            });
            
            // 添加删除按钮事件监听
            if (currentUser?.isAdmin) {
                const deleteBtns = document.querySelectorAll('.delete-btn');
                deleteBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = parseInt(btn.getAttribute('data-id'));
                        deleteWebsite(id);
                    });
                });
            }
        } catch (error) {
            console.error('渲染网站列表时发生错误:', error);
            websitesList.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }

    // 删除网站
    async function deleteWebsite(id) {
        if (confirm('确定要删除这个网站吗？')) {
            try {
                // 使用Supabase删除网站
                const { error } = await supabase
                    .from('websites')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    console.error('删除网站失败:', error);
                    // 检查是否是权限错误
                    if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy')) {
                        showSuccess('删除网站失败: 您没有管理员权限');
                    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        showSuccess('删除网站失败: websites表不存在');
                    } else {
                        showSuccess('删除网站失败');
                    }
                    return;
                }
                
                // 重新渲染网站列表
                await renderWebsites();
                showSuccess('网站已删除');
            } catch (error) {
                console.error('删除网站时发生错误:', error);
                showSuccess('删除网站失败: 网络错误');
            }
        }
    }

    // 设置实时订阅
    function setupRealtimeSubscription() {
        if (!supabase) return;
        
        try {
            supabase
                .channel('websites-changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'websites'
                }, async () => {
                    // 数据变化时重新渲染网站列表
                    await renderWebsites();
                })
                .subscribe();
        } catch (error) {
            console.warn('实时订阅设置失败:', error);
        }
    }

    // 初始化应用
    document.addEventListener('DOMContentLoaded', async () => {
        await initData();
        await checkLoginStatus();
        setupRealtimeSubscription();
    });

    // 键盘事件处理
    document.addEventListener('keydown', (e) => {
        // ESC键关闭模态框
        if (e.key === 'Escape' && addWebsiteModal.classList.contains('active')) {
            cancelAddBtn.click();
        }
    });

    // 监听Supabase认证状态变化
    if (supabase) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                await handleLoggedInUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                await checkLoginStatus();
            } else if (event === 'USER_UPDATED' && session?.user) {
                await handleLoggedInUser(session.user);
            }
        });
    }

})();
