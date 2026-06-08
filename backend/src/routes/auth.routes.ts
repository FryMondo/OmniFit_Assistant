import {Router} from 'express';
import {registerUser, loginUser} from '../services/auth/auth.service';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const {email, password, username, first_name, last_name, role} = req.body;

        if (!email || !password || !username || !first_name || !last_name || !role) {
            return res.status(400).json({error: 'Всі поля є обов\'язковими для заповнення'});
        }

        if (password.length < 6) {
            return res.status(400).json({error: 'Пароль має містити щонайменше 6 символів'});
        }

        const authData = await registerUser({
            email, password, username, first_name, last_name, role
        });

        res.status(201).json({
            message: 'Користувача успішно зареєстровано',
            user: authData.user
        });

    } catch (error: any) {
        res.status(400).json({error: error.message});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({error: 'Email та пароль є обов\'язковими'});
        }

        const authData = await loginUser(email, password);

        res.json({
            message: 'Вхід успішний',
            session: authData.session,
            user: authData.user
        });

    } catch (error: any) {
        res.status(401).json({error: error.message});
    }
});

export default router;