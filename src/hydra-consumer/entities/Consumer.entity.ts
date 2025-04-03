import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
export enum ConsumerStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
    REQUESTED = 'REQUESTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

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

    @Exclude()
    @Column({
        default: '',
    })
    password: string;

    @Column({
        default: new Date().toISOString(),
    })
    createdAt: string;

    @Column({
        type: 'enum',
        enum: ConsumerStatus,
        default: ConsumerStatus.REQUESTED,
    })
    status: ConsumerStatus;
}
