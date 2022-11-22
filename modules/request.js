export class Request
{
    attributes = null;
    body = null;
    headers = {
        Accept: this.constructor.HEADER_CONTENT_TYPE,
    };
    method = 'GET';

    static get HEADER_CONTENT_TYPE()
    {
        return '*/*';
    }

    getLcdBaseUrl()
    {
        return 'https://phoenix-lcd.terra.dev';
    }

    getFcdBaseUrl()
    {
        return 'https://phoenix-fcd.terra.dev';
    }

    getType()
    {
        return this.constructor.name;
    }

    send(url, attributes)
    {
        const method = this.method;
        if (attributes && (method === 'PATCH' || method === 'POST'))
        {
            if (typeof attributes !== 'string')
            {
                this.body = JSON.stringify(
                    {
                        data : {
                            attributes,
                            id   : token,
                            type : this.getType()
                        }
                    }
                );
            }
        }
        return fetch(url, this);
    }
}