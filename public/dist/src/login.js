document.addEventListener('alpine:init', () => {
    Alpine.data('login', () => ({
        init() {
            this.user = {
                name:'',
                password:'',
            }
            this.state = {
                button:false,
                name:true,
                password: true
            }
        },
        async submitFormLogin(){
            this.state.button = true;
            if(this.user.name === '' || this.user.password === ''){
                if(this.user.name === ''){
                    this.state.name = false;
                }
                if(this.user.password === ''){
                    this.state.password = false;
                }
                Toastify({
                    text: '账号或密码不能为空!',
                    duration: 1000,
                    className: "info",
                    gravity: "top",
                    position: "center",
                    callback:()=>{
                        this.state.button = false;
                    }
                }).showToast();
                return false;
            }
            const res = await axios.post('/login', {
                ...this.user,
            });
            Toastify({
                text: typeof res.data === 'string' ? '登录成功！':res.data.message,
                duration: 2000,
                className: "info",
                gravity: "top",
                position: "center",
                callback:()=>{
                    this.state.button= false;
                }
            }).showToast();
            if(typeof res.data === 'string'){
                this.$refs.form.submit();
            }
        }
    }))
})