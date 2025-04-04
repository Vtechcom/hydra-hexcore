import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ConsumerKeyMapper } from './ConsumerKeyMapper.entity';

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

    @OneToMany(() => ConsumerKeyMapper, mapper => mapper.consumer)
    mappers: ConsumerKeyMapper[];

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
