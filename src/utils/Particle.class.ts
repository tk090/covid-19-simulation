import { STATUS, IOptions } from '@/utils/types';

export class Particle {
  id: number;

  x: number;
  y: number;

  speed: number;
  directions: number;
  d: { x: number, y: number };

  status: STATUS = STATUS.S;
  duration: number = 1;

  wearsMask: boolean;
  obeysSocialDistancing: boolean;

  contactList: any = {};

  effectiveContacts: number = 0;
  basicContacts: number = 0;

  travelling: boolean = false;
  travelCounter: number = 40;
  postTravelSpeed: number = 0;

  sectorId: number = 0;

  constructor(id: number, status: STATUS, options: IOptions) {
    this.id = id;

    this.status = status;

    this.x = Math.random() * options.width;
    this.y = Math.random() * options.height;
    this.speed = options.speed + Math.random() * 2 * options.speed
    this.directions = (2 * Math.PI * Math.random()) - Math.PI;
    
    this.d = {
      x: Math.cos(this.directions) * this.speed,
      y: Math.sin(this.directions) * this.speed
    }

    this.obeysSocialDistancing = Math.random() < options.socialDistancingParticipation;
    this.wearsMask = Math.random() < options.maskParticipation;
  }

  move(ops: IOptions, particles: Particle[]) {
    if (this.travelCounter > 0) {

      if (this.x >= ops.width || this.x <= 0) {
        this.d.x *= -1;
      }

      if (ops.communities) {
        const communityWidth = ops.width / ops.communities;

        const xSector = Math.floor(this.x / communityWidth);
        const ySector = Math.floor(this.y / communityWidth);

        this.sectorId = xSector + (ops.communities! * ySector);

        for (let x = 1; x < ops.communities; x++) {
          this.xBarrier(x * communityWidth, ops.border);
        }

        for (let y = 1; y < ops.communities; y++) {
          this.yBarrier(y * communityWidth, ops.border);
        }
      }
  
      if (this.y >= ops.height || this.y <= 0) {
        this.d.y *= -1;
      }
      
      this.x > ops.width ? this.x = ops.width : this.x;
      this.y > ops.height ? this.y = ops.height : this.y;
      this.x < 0 ? this.x = 0 : this.x;
      this.y < 0 ? this.y = 0 : this.y;
  
      this.x += this.d.x;
      this.y += this.d.y;
  
      if (this.obeysSocialDistancing) {
        if (this.status !== STATUS.D && this.status !== STATUS.Q && !this.travelling && this.d.x !== 0 && this.d.y !== 0) {
          for (let i = 0; i < particles.length; i++) {
            const ang = Math.atan2(this.y - particles[i].y, this.x - particles[i].x);
            const dist = Math.sqrt(Math.pow(particles[i].x - this.x, 2) + Math.pow(particles[i].y - this.y, 2));
            const force = this.mapRange(ops.socialDistancing, 0, 1, 0, 0.05) * dist;
    
            if (dist < 25) {
              this.x += force * Math.cos(ang);
              this.y += force * Math.sin(ang);
            }
          }
        }
      }
    } else {
      this.travelling = false;
      this.travelCounter = 40;
      this.speed = this.postTravelSpeed + Math.random() * 2 * this.postTravelSpeed
      this.directions = (2 * Math.PI * Math.random()) - Math.PI;
      
      this.d = {
        x: Math.cos(this.directions) * this.speed,
        y: Math.sin(this.directions) * this.speed
      }
    }

    if (this.status === STATUS.I || this.status === STATUS.Q) {
      this.duration++;
    }

    if (this.travelling) {
      this.travelCounter--;
    }
  
  }

  mapRange(value: number, low1: number, high1: number, low2: number, high2: number) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

  distance(x: number, y: number): number {
    return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2))
  }

  travelTo(x: number, y: number, speed: number): void {
    const directions = Math.atan2(y - this.y, x - this.x);
    const travelSpeed = 4;

    this.d = {
      x: Math.cos(directions) * travelSpeed,
      y: Math.sin(directions) * travelSpeed,
    }

    this.travelCounter = (x - this.x) / this.d.x;
    this.travelling = true;
    this.postTravelSpeed = speed;
  }

  xBarrier(x: number, border: number | undefined): void {
    if ((this.x <= x && this.x + this.d.x >= x) || (this.x >= x && this.x + this.d.x <= x)) {
      if (!this.travelling && Math.random() < (border || 1)) {
        this.d.x *= -1;
      }
    }
  }

  yBarrier(y: number, border: number | undefined): void {
    if ((this.y <= y && this.y + this.d.y >= y) || (this.y >= y && this.y + this.d.y <= y)) {
      if (!this.travelling && Math.random() < (border || 1)) {
        this.d.y *= -1;
      }
    }
  }
}