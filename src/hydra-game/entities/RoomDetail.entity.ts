import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { GameRoom } from './Room.entity';
import { GameUser } from './GameUser.entity';

@Entity({
    name: 'game_room_detail',
})
export class GameRoomDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => GameRoom, gameRoom => gameRoom.gameRoomDetails)
    room: GameRoom;

    @OneToOne(() => GameUser)
    @JoinColumn()
    user: GameUser;

    @Column({
        default: new Date().toISOString(),
    })
    createdAt: string;

    @Column({
        default: null,
    })
    deletedAt: string | null;

    @Column({
        unique: true,
    })
    port: number;
}
