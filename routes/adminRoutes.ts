import { Router, Request, Response } from 'express'
import UserModel from '../models/User'
const router = Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

router.post('/admin-login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user || user.role !== 'Admin') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token });
});

router.get('/users', async (req: Request, res: Response) => {
    const users = await UserModel.find()
    res.status(200).json({ users })
})

router.put('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, isVerified } = req.body;

    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            id,
            { name, email, isVerified },
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.patch('/users/:id/block', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { block } = req.body;

    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            id,
            { isBlocked: block },
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error blocking/unblocking user' });
    }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await UserModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default router;