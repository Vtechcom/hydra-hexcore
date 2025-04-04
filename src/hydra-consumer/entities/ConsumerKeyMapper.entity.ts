import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Consumer } from './Consumer.entity';
import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';

@Entity()
export class ConsumerKeyMapper {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Consumer, consumer => consumer.id)
    @JoinColumn({ name: 'consumerId' })
    consumer: Consumer;

    @Column({
        unique: true,
    })
    consumerKey: string;

    @Column({
        default: '',
    })
    url: string;

    @ManyToOne(() => HydraNode, hydraNode => hydraNode.id)
    @JoinColumn({ name: 'hydraNodeId' })
    hydraNode: HydraNode;

    @Column({
        default: false,
    })
    isActive: boolean;

    @Column({
        default: new Date().toISOString(),
    })
    createdAt: string;

    @Column({
        default: new Date().toISOString(),
    })
    updatedAt: string;
}
