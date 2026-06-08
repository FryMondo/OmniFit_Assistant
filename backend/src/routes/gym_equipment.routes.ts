import {Router} from 'express';
import {
    addEquipment,
    getEquipmentByGymId,
    updateEquipment,
    deleteEquipment
} from '../services/db/gym_equipment.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const equipmentData = req.body;

        if (!equipmentData.gym_id || !equipmentData.equipment_name) {
            return res.status(400).json({error: 'gym_id та equipment_name є обов\'язковими'});
        }

        const newEquipment = await addEquipment(equipmentData);

        if (!newEquipment) {
            return res.status(400).json({error: 'Не вдалося додати інвентар'});
        }

        res.status(201).json(newEquipment);
    } catch (error) {
        console.error("Route Error (Add Equipment):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/gym/:gymId', async (req, res) => {
    try {
        const {gymId} = req.params;
        const equipmentList = await getEquipmentByGymId(gymId);

        res.json(equipmentList);
    } catch (error) {
        console.error("Route Error (Get Equipment by Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const updates = req.body;

        const updatedEquipment = await updateEquipment(id, updates);

        if (!updatedEquipment) {
            return res.status(400).json({error: 'Не вдалося оновити інвентар'});
        }

        res.json(updatedEquipment);
    } catch (error) {
        console.error("Route Error (Update Equipment):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteEquipment(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити інвентар'});
        }

        res.json({message: 'Інвентар успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Equipment):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;