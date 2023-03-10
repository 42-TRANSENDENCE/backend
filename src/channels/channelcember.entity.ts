import { 
    CreateDateColumn,
    Entity,
    UpdateDateColumn ,
    Column,
    ManyToOne,
    PrimaryColumnCannotBeNullableError,
    PrimaryGeneratedColumn,
    JoinColumn,
} from "typeorm";
import { Channels } from './channels.entity'

@Entity()
export class ChannelMember {
    @PrimaryGeneratedColumn()
    id:number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ primary: true })
    ChannelId: number;
  
    @Column({ primary: true })
    UserId: number;

    /**
   * 1 : M 관계 설정
   * @ManyToOne 
   * 여기서 Many 는 채널 이고 One이 멤버 이다. 
   */
    @ManyToOne(() => Channels)
    @JoinColumn({name: "ChannelId"})
    channelMember: ChannelMember;
}