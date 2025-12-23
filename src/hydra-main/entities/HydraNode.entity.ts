import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Account } from './Account.entity';
import { Exclude } from 'class-transformer';
import { HydraHead } from 'src/hydra-heads/entities/HydraHead.entity';

@Entity()
export class HydraNode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true,
        default: 'hydra-node',
    })
    description: string;

    @Column({
        unique: true,
    })
    port: number;

    @Exclude()
    @Column()
    skey: string;

    @Column()
    vkey: string;

    @Column()
    cardanoVKey: string;

    @Column()
    cardanoSKey: string;

    @ManyToOne(() => Account, account => account.id)
    cardanoAccount: Account;

    @ManyToOne(() => HydraHead, hydraHead => hydraHead.hydraNodes)
    hydraHead: HydraHead;

    @Column({
        default: new Date().toISOString(),
    })
    createdAt: string;
}
