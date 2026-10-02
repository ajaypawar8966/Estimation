/**
 * District → Janpad Panchayat options for the Edit Profile location picker.
 * There is no API for this yet; extend this list (or swap it for an API call)
 * as needed. Panchayats and villages are typed in by the user.
 */
export const DISTRICTS: Record<string, string[]> = {
  Bhopal: ['Berasia', 'Phanda'],
  Raisen: [
    'Badi',
    'Begamganj',
    'Gairatganj',
    'Obedullaganj',
    'Sanchi',
    'Silwani',
    'Udaipura',
  ],
  Sehore: ['Ashta', 'Budhni', 'Ichhawar', 'Nasrullaganj', 'Sehore'],
  Vidisha: ['Basoda', 'Gyaraspur', 'Kurwai', 'Lateri', 'Nateran', 'Sironj', 'Vidisha'],
};
