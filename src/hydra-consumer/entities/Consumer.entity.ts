import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Consumer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    address: string;

    @Column({
        default: '',
    })
    avatar: string;

    @Column({
        default: '',
    })
    registrationTx: string;

    @Column({
        default: '',
    })
    apikey: string;

    @Column({
        default: '',
    })
    password: string;

    @Column({
        default: new Date().toISOString(),
    })
    createdAt: string;

    @Column({
        default: 'ACTIVE',
    })
    status: string;
}
