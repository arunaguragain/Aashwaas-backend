import z from 'zod';

export const DonationSchema = z.object({
    itemName: z.string().min(2, "Item name must be at least 2 characters"),
    category: z.enum([
        'Clothes',
        'Books',
        'Electronics',
        'Furniture',
        'Food',
        'Other'
    ]),
    description: z.string().optional(),
    quantity: z.string().min(1, "Quantity is required"),
    condition: z.enum([
        'New',
        'Like New',
        'Good',
        'Fair'
    ]),
    pickupLocation: z.string().min(5, "Pickup location is required"),
    media: z.string().optional(),
    donorId: z.string().optional(),
    status: z.enum(['pending', 'approved', 'assigned', 'completed', 'cancelled']).default('pending'),
});

export type DonationType = z.infer<typeof DonationSchema>;
