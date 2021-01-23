import got from 'got';
import sharp from 'sharp';
import { Responses, Skin, Texture } from './types';
import * as endpoints from './endpoints';

/**
 * This class represents a player in Minecraft. It interacts with the
 * Mojang API (credit to wiki.vg for mapping out all the endpoints) to get
 * all the attributes in all the accessor methods.
 */
export default class Player {
  private name: string | null;

  private uuid: string | null;

  public constructor(name?: string, uuid?: string) {
    this.name = name || null;
    this.uuid = uuid || null;
  }

  /**
   * This decodes the base64 encoding which represents the player's
   * texture, this can include a cape, skin, both, or neither.
   * @param {Texture} texture
   * @returns {Skin}
   */
  public static parseTexture(texture: Texture): Skin {
    const decoded = Buffer.from(texture.value, 'base64')
      .toString('utf-8');
    return JSON.parse(decoded);
  }

  /**
   * Retrieves the UUID of this player, this method should always be called
   * when trying to access the UUID property.
   * Playername -> UUID
   * @link https://wiki.vg/Mojang_API#Username_-.3E_UUID_at_time
   * @returns {Promise<string>}
   */
  public async getUUID(): Promise<string> {
    if (this.uuid !== null) {
      return this.uuid;
    }

    const name = await this.getName();
    const target = endpoints.UUID.replace(/({playername})/g, name);
    const res = await got(target);
    const body = JSON.parse(res.body) as Responses.UUID;

    this.uuid = body.id;
    return body.id;
  }

  /**
   * This gets the playername assigned to the UUID.
   * @returns {Promise<string>}
   */
  public async getName(): Promise<string> {
    if (this.name != null) {
      return this.name;
    }

    const profile = await this.getProfile();

    this.name = profile.name;

    return profile.name;
  }

  /**
   * Retrieves the name history of this player
   * UUID -> Name history
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Name_history
   * @returns {Promise<NameHistory>}
   */
  public async getNameHistory(): Promise<Responses.NameHistory> {
    const uuid = await this.getUUID();
    const target = endpoints.NAME_HISTORY.replace(/({uuid})/g, uuid);
    const res = await got(target);
    const body = JSON.parse(res.body) as Responses.NameHistory;

    return body;
  }

  /**
   * This gets the player's profile
   * GET UUID -> Profile + Skin/Cape
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
   * @returns {Promise<Profile>}
   */
  public async getProfile(): Promise<Responses.Profile> {
    const uuid = await this.getUUID();
    const name = await this.getName();
    const target = endpoints.PROFILE.replace(/({uuid})/g, uuid);

    try {
      const res = await got(target);
      const body = JSON.parse(res.body) as Responses.Profile;
      return body;
    } catch (err) {
      const texture: Skin = {
        timestamp: 0,
        profileId: uuid,
        profileName: name,
        signatureRequired: false,
        textures: {
          SKIN: {
            // Steve
            url: 'http://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b',
          },
        },
      };

      return {
        id: uuid,
        name,
        properties: [{
          name: 'textures',
          value: Buffer.from(JSON.stringify(texture)).toString('base64'),
        }],
      };
    }
  }

  /**
   * This decodes the base64 encoding representing the player's skin, cape,
   * or both. It then gets the file from that link and returns it into a Buffer
   * @returns {Promise<Buffer>}
   * @throws {Error} if there is no custom skin
   */
  public async getSkin(): Promise<Buffer> {
    const profile = await this.getProfile();

    if (profile.properties.length >= 1) {
      const texture = profile.properties[0];
      const parsed = Player.parseTexture(texture);

      if (parsed.textures.SKIN) {
        const target = new URL(parsed.textures.SKIN.url);

        target.protocol = 'https';

        const res = await got(target.toString(), { body: 'buffer' });
        return Buffer.from(res.body);
      }
      throw new Error('No custom skin');
    } else {
      throw new Error('No custom skin');
    }
  }

  /**
   * This method crops the head out of the skin into a buffer
   * @returns {Promise<Buffer>}
   */
  public async getHead(): Promise<Buffer> {
    const skin = await this.getSkin();
    const image = sharp(skin);
    const head = image
      .extract({
        top: 8,
        left: 8,
        width: 8,
        height: 8,
      }).resize(200, 200, {
        kernel: sharp.kernel.nearest,
      });

    return new Promise((resolve, reject) => {
      head.toBuffer(((err, buffer) => {
        if (err) reject(err);
        else {
          resolve(buffer);
        }
      }));
    });
  }

  /**
   * Gets the URL of the player's skin
   * @returns {Promise<string>}
   * @throws {Error} if there is no custom skin
   */
  public async getSkinURL(): Promise<string> {
    const profile = await this.getProfile();

    if (profile.properties.length >= 1) {
      const texture = profile.properties[0];
      const parsed = Player.parseTexture(texture);

      if (parsed.textures.SKIN) {
        return parsed.textures.SKIN.url;
      }
      throw new Error('No custom skin');
    } else {
      throw new Error('No custom skin');
    }
  }
}
