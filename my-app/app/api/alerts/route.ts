// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Alert = {
  title: string;
  description: string;
  source?: string;
};

type AlertsResponse = {
  alerts: Alert[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng are required' },
      { status: 400 }
    );
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: 'lat and lng must be numbers' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENWEATHER_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&units=metric`;

    const externalResp = await fetch(url);
    if (!externalResp.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch external alerts' },
        { status: externalResp.status }
      );
    }

    const externalData: any = await externalResp.json();
    const rawAlerts: any[] = externalData.alerts || [];

    const alerts: Alert[] = rawAlerts.map((a) => ({
      title: a.event || 'Weather Alert',
      description: a.description || '',
      source: a.sender_name || 'OpenWeather',
    }));

    const body: AlertsResponse = { alerts };
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
