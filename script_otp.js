// OTP验证码验证版本
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

    // 创建OTP验证界面
    const otpModal = document.createElement('div');
    otpModal.id = 'otp-verification-modal';
    otpModal.className = 'modal';
    otpModal.innerHTML = `
        <div class="modal-content glass-card" style="max-width: 400px; text-align: center;">
            <h3 class="modal-title">📧 邮箱验证码</h3>
            <p style="margin-bottom: 20px; color: #666;">
                我们向 <strong id="otp-email-display"></strong> 发送了一个6位验证码
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                <input type="text" id="otp-input-1" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
                <input type="text" id="otp-input-2" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
                <input type="text" id="otp-input-3" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
                <input type="text" id="otp-input-4" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
                <input type="text" id="otp-input-5" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
                <input type="text" id="otp-input-6" maxlength="1" class="glass-input otp-input" style="width: 50px; text-align: center; font-size: 24px;">
            </div>
            <div class="form-actions">
                <button type="button" id="cancel-otp" class="cancel-btn">取消</button>
                <button type="button" id="verify-otp" class="auth-btn">验证</button>
            </div>
            <p id="otp-error" class="auth-error"></p>
            <p style="margin-top: 15px; font-size: 0.9em; color: #888;">
                没有收到验证码？ 
                <a href="#" id="resend-otp" style="color: #4a90d9;">重新发送</a>
            </p>
            <p id="otp-timer" style="display: none; color: #666;">请等待 <span id="countdown">60</span> 秒后可重新发送</p>
        </div>
    `;
    document.body.appendChild(otpModal);

    // OTP输入框的样式
    const otpStyle = document.createElement('style');
    otpStyle.textContent = `
        .otp-input {
            height: 60px;
            font-weight: bold;
            letter-spacing: 5px;
        }
        .otp-input:focus {
            border-color: #4a90d9;
            box-shadow: 0 0 10px rgba(74, 144, 217, 0.3);
        }
    `;
    document.head.appendChild(otpStyle);

    // 存储待验证的邮箱和OTP token
    let pendingOtpEmail = '';
    let pendingOtpToken = '';
    let otpCountdown = 60;
    let otpTimerInterval = null;

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
        PENDING_EMAIL: 'personal_website_pending_email'
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

    // OTP相关函数
    function setupOtpInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                // 只允许输入数字
                this.value = this.value.replace(/\D/g, '');
                
                if (this.value.length === 1 && index < otpInputs.length - 1) {
otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                
                pastedData.split('').forEach((char, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = char;
                    }
                });
                
                // 聚焦到最后一个输入框
                if (pastedData.length > 0 && otpInputs[pastedData.length]) {
                    otpInputs[pastedData.length].focus();
                }
            });
        });
    }

    function getOtpCode() {
        let code = '';
        for (let i = 1; i <= 6; i++) {
            code += document.getElementById(`otp-input-${i}`).value;
        }
        return code;
    }

    function clearOtpInputs() {
        for (let i = 1; i <= 6; i++) {
            document.getElementById(`otp-input-${i}`).value = '';
        }
        document.getElementById('otp-input-1').focus();
    }

    function startOtpTimer() {
        otpCountdown = 60;
        document.getElementById('resend-otp').style.display = 'none';
        document.getElementById('otp-timer').style.display = 'block';
        document.getElementById('countdown').textContent = otpCountdown;
        
        if (otpTimerInterval) {
            clearInterval(otpTimerInterval);
        }
        
        otpTimerInterval = setInterval(() => {
            otpCountdown--;
            document.getElementById('countdown').textContent = otpCountdown;
            
            if (otpCountdown <= 0) {
                clearInterval(otpTimerInterval);
                document.getElementById('resend-otp').style.display = 'inline';
                document.getElementById('otp-timer').style.display = 'none';
            }
        }, 1000);
    }

    function stopOtpTimer() {
        if (otpTimerInterval) {
            clearInterval(otpTimerInterval);
            otpTimerInterval = null;
        }
    }

    function showOtpModal(email, token) {
        pendingOtpEmail = email;
        pendingOtpToken = token;
        document.getElementById('otp-email-display').textContent = email;
        document.getElementById('otp-error').textContent = '';
        clearOtpInputs();
        otpModal.classList.add('active');
        startOtpTimer();
    }

    function hideOtpModal() {
        stopOtpTimer();
        otpModal.classList.remove('active');
        pendingOtpEmail = '';
        pendingOtpToken = '';
    }

    // 验证OTP
    async function verifyOtp() {
        const code = getOtpCode();
        const otpError = document.getElementById('otp-error');
        
        if (code.length !== 6) {
            showError(otpError, '请输入完整的6位验证码');
            return;
        }
        
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: pendingOtpEmail,
                token: code,
                type: 'email'
            });
            
            if (error) {
                showError(otpError, '验证码错误，请重新输入');
                clearOtpInputs();
                return;
            }
            
            // 验证成功
            hideOtpModal();
            
            // 创建用户资料并登录
            const username = localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL)?.split('@')[0] || pendingOtpEmail.split('@')[0];
            
            await createUserProfile(data.user.id, username, pendingOtpEmail);
            
            const currentUser = {
                id: data.user.id,
                username: username,
                email: pendingOtpEmail,
                isAdmin: isAdminEmail(pendingOtpEmail)
            };
            
            loginUser(currentUser);
            
        } catch (error) {
            console.error('OTP验证时发生错误:', error);
            showError(otpError, '验证失败，请稍后重试');
        }
    }

    // 重新发送OTP
    async function resendOtp() {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: pendingOtpEmail,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                showError(document.getElementById('otp-error'), '重新发送失败: ' + error.message);
                return;
            }
            
            showSuccess('新的验证码已发送，请查收');
            clearOtpInputs();
            startOtpTimer();
            
        } catch (error) {
            console.error('重新发送OTP时发生错误:', error);
            showError(document.getElementById('otp-error'), '重新发送失败，请稍后重试');
        }
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

    // 创建用户资料
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
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    console.log('无法创建用户资料（RLS策略限制），这可能是正常的');
                } else {
                    console.error('创建用户资料失败:', error);
                }
                return { success: false, isRLSError: true };
            }
            
            return { success: true, data };
        } catch (err) {
            console.error('创建用户资料时发生异常:', err);
            return { success: false, error: err };
        }
    }

    // 注册功能 - 使用OTP验证码
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
        
        // 禁用注册按钮
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '发送验证码...';
        
        try {
            // 使用Supabase注册（发送OTP到邮箱）
            const { data, error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: true,
                    password: password,
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) {
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    showError(registerError, '请求过于频繁，请稍后再试');
                } else if (error.message.includes('User already registered') || error.message.includes('already been taken')) {
                    showError(registerError, '该邮箱已被注册，请直接登录');
                } else {
                    showError(registerError, '发送验证码失败: ' + error.message);
                }
                return;
            }
            
            // 保存待验证信息
            localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
            
            // 显示OTP验证界面
            showOtpModal(email, data?.token || 'signup');
            
            showSuccess('验证码已发送至您的邮箱，请查收！\n如果没有收到，请检查垃圾邮件文件夹。');
            
        } catch (error) {
            console.error('注册时发生错误:', error);
            showError(registerError, '注册失败: 网络错误，请检查网络连接');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
        }
    });

    // 登录功能 - 使用OTP验证码（可选）
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            showError(loginError, '请输入邮箱和密码');
            return;
        }
        
        const isAdmin = isAdminEmail(email);
        
        // 禁用登录按钮
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        
        try {
            // 先尝试普通密码登录
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                // 如果是邮箱未确认，尝试OTP登录
                if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
                    // 发送OTP进行登录
                    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
                        email: email,
                        options: {
                            password: password,
                            shouldCreateUser: false
                        }
                    });
                    
                    if (otpError) {
                        showError(loginError, '发送验证码失败: ' + otpError.message);
                        return;
                    }
                    
                    // 显示OTP验证界面
                    localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
                    showOtpModal(email, otpData?.token || 'login');
                    showSuccess('请输入收到的验证码完成登录');
                    return;
                }
                
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    showError(loginError, '请求过于频繁，请稍后再试');
                    return;
                }
                
                if (error.message.includes('Invalid') || error.message.includes('credentials')) {
                    showError(loginError, '邮箱或密码错误');
                    return;
                }
                
                showError(loginError, '登录失败: ' + error.message);
                return;
            }
            
            // 普通登录成功
            await handleLoggedInUser(data.user);
            
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
            
            loginUser(currentUser);
            
        } catch (error) {
            console.error('登录时发生错误:', error);
            showError(loginError, '登录失败: 网络错误，请检查网络连接');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    });

    // OTP验证按钮事件
    document.getElementById('verify-otp').addEventListener('click', verifyOtp);
    document.getElementById('cancel-otp').addEventListener('click', hideOtpModal);
    document.getElementById('resend-otp').addEventListener('click', function(e) {
        e.preventDefault();
        resendOtp();
    });

    // 初始化OTP输入框
    setupOtpInputs();

    // 登录用户函数
    async function loginUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        
        authScreen.classList.remove('active');
        setTimeout(async () => {
            authScreen.style.display = 'none';
            mainContent.classList.add('active');
            mainContent.style.display = 'block';
            
            initUserInfo();
            await renderWebsites();
            checkPermissions(user);
            logoutBtn.style.display = 'block';
            
            loginError.textContent = '';
            registerError.textContent = '';
        }, 300);
    }

    // 检查登录状态
    async function checkLoginStatus() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        
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
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                authScreen.style.display = 'none';
                mainContent.classList.add('active');
mainContent.style.display = 'block';
                
                initUserInfo();
                await renderWebsites();
                checkPermissions(currentUser || { isAdmin: isAdminEmail(user.email) });
                logoutBtn.style.display = 'block';
            } else if (currentUser) {
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                
                authScreen.classList.add('active');
                authScreen.style.display = 'flex';
                mainContent.classList.remove('active');
                mainContent.style.display = 'none';
                logoutBtn.style.display = 'none';
            } else {
                authScreen.classList.add('active');
                authScreen.style.display = 'flex';
                mainContent.classList.remove('active');
                mainContent.style.display = 'none';
                logoutBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('检查登录状态时发生错误:', error);
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
            if (supabase) {
                await supabase.auth.signOut();
            }
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(STORAGE_KEYS.REMEMBERED_USER);
            localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
            await checkLoginStatus();
        } catch (error) {
            console.error('登出时发生错误:', error);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(STORAGE_KEYS.REMEMBERED_USER);
            localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
            await checkLoginStatus();
        }
    });

    // 页面切换
    const navbarBtns = document.querySelectorAll('.navbar-btn');
    navbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.getAttribute('data-page');
            
            navbarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pages.forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(targetPage).classList.add('active');
        });
    });

    // 初始化用户信息
    function initUserInfo() {
        const savedAvatar = localStorage.getItem(STORAGE_KEYS.USER_AVATAR);
        if (savedAvatar) {
            userAvatar.src = savedAvatar;
        }
        
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
            addWebsiteBtn.style.display = 'flex';
        } else {
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
            const { error } = await supabase
                .from('websites')
                .insert({
                    url: url,
                    description: description,
                    category: category
                });
            
            if (error) {
                console.error('添加网站失败:', error);
                if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy')) {
                    showError(addError, '添加网站失败: 您没有管理员权限');
                } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    showError(addError, '添加网站失败: websites表不存在，请联系管理员');
                } else {
                    showError(addError, '添加网站失败: ' + error.message);
                }
                return;
            }
            
            await renderWebsites();
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
            const { data: websites, error } = await supabase
                .from('websites')
                .select('*')
                .order('created_at', { ascending: false });
            
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            
            if (error) {
                console.error('获取网站数据失败:', error);
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    emptyState.innerHTML = '<p>网站列表暂不可用，请在Supabase控制台中创建websites表</p>';
                } else if (error.code === '42501' || error.message.includes('row-level security')) {
                    emptyState.innerHTML = '<p>网站列表加载失败，请刷新页面重试</p>';
                } else {
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
            websitesList.innerHTML = '';
            
            const categoriesContainer = document.createElement('div');
            categoriesContainer.className = 'categories-container';
            websitesList.appendChild(categoriesContainer);
            
            const categories = ['学习', '游戏', '工具'];
            const groupedWebsites = {};
            
            categories.forEach(category => {
                groupedWebsites[category] = [];
            });
            
            websites.forEach(website => {
                const category = website.category || '未分类';
                if (groupedWebsites[category]) {
                    groupedWebsites[category].push(website);
                } else {
                    groupedWebsites[category] = [website];
                }
            });
            
            categories.forEach(category => {
                const categoryWebsites = groupedWebsites[category];
                if (categoryWebsites.length > 0) {
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    
                    const categoryTitle = document.createElement('h3');
                    categoryTitle.className = 'category-title';
                    categoryTitle.textContent = category;
                    categorySection.appendChild(categoryTitle);
                    
                    const categoryList = document.createElement('div');
                    categoryList.className = 'category-websites';
                    
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
                const { error } = await supabase
                    .from('websites')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    console.error('删除网站失败:', error);
                    if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy')) {
                        showSuccess('删除网站失败: 您没有管理员权限');
                    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        showSuccess('删除网站失败: websites表不存在');
                    } else {
                        showSuccess('删除网站失败');
                    }
                    return;
                }
                
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
        if (e.key === 'Escape' && addWebsiteModal.classList.contains('active')) {
            cancelAddBtn.click();
        }
        if (e.key === 'Escape' && otpModal.classList.contains('active')) {
            hideOtpModal();
        }
        if (e.key === 'Enter' && otpModal.classList.contains('active')) {
            verifyOtp();
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
