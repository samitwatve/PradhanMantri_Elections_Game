import json

with open('states_data.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

total_seats = sum(int(state['LokSabhaSeats']) for state in data)
print(f'Total Lok Sabha seats: {total_seats}')

# Check for Daman/Dadra entries
daman_dadra = [state for state in data if 'Daman' in state['State'] or 'Dadra' in state['State']]
print(f'Daman/Dadra entries: {len(daman_dadra)}')
for state in daman_dadra:
    print(f'  {state["State"]}: {state["SvgId"]} - {state["LokSabhaSeats"]} seats')

# Check for Lakshadweep
lakshadweep = [state for state in data if 'Lakshadweep' in state['State']]
print(f'Lakshadweep entries: {len(lakshadweep)}')
for state in lakshadweep:
    print(f'  {state["State"]}: {state["SvgId"]} - Union Territory: {state["UnionTerritory"]}, Coastal: {state["CoastalIndia"]}, Tourism: {state["TravelAndTourism"]}')

# Check all Union Territories
union_territories = [state for state in data if state['UnionTerritory'] == 'TRUE']
print(f'\nAll Union Territories ({len(union_territories)}):')
for ut in union_territories:
    print(f'  {ut["State"]}: {ut["SvgId"]} - {ut["LokSabhaSeats"]} seats')

# Check all Coastal states/UTs
coastal = [state for state in data if state['CoastalIndia'] == 'TRUE']
print(f'\nAll Coastal states/UTs ({len(coastal)}):')
for state in coastal:
    print(f'  {state["State"]}: {state["SvgId"]}')

# Check all Travel and Tourism states/UTs
tourism = [state for state in data if state['TravelAndTourism'] == 'TRUE']
print(f'\nAll Travel and Tourism states/UTs ({len(tourism)}):')
for state in tourism:
    print(f'  {state["State"]}: {state["SvgId"]}')
