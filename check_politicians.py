import json

# Load and check politicians data
with open('politicians-data.json', 'r') as f:
    data = json.load(f)

politicians = data['politicians']
print(f"Total politicians: {len(politicians)}")
print("\nPoliticians and their parties:")
for p in politicians:
    print(f"{p['name']}: '{p['party']}'")

parties = [p['party'] for p in politicians]
unique_parties = list(set(parties))
print(f"\nUnique parties: {unique_parties}")
print(f"Number of unique parties: {len(unique_parties)}")

# Check for potential opponent availability for each politician
print("\nOpponent availability check:")
for politician in politicians:
    available_opponents = [p for p in politicians if p['party'] != politician['party'] and p['id'] != politician['id']]
    print(f"{politician['name']} ({politician['party']}) has {len(available_opponents)} potential opponents")
