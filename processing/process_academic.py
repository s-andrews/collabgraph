import json

def main():

    people = {}
    publications = {}
    links = []

    with open("raw_data/publications.txt") as file:
        for line in file:
            sections = line.split("\t")
            if sections[0] == "Authors": 
                continue

            authors = sections[0]
            title = sections[7]
            year = sections[9]
            url = sections[10]
            eid = parse_eid(url)

            publications[eid] = {
                "authors": authors,
                "title" : title,
                "year" : year,
                "url" : url,
                "eid" : eid
            }

            people_on_paper = []
            for i in range(2, 6):
                if sections[i] == "":
                    continue
                if not sections[i] in people:
                    if i < 4:
                        people[sections[i]] = {"name":sections[i], "type":"GroupLeader"}
                    else:
                        people[sections[i]] = {"name":sections[i], "type":"Facility"}
                
                people_on_paper.append(sections[i])

            for p1 in people_on_paper:
                for p2 in people_on_paper:
                    if p1 == p2:
                        continue
                    links.append({"eid":eid, "from":p1, "to":p2})

    with open("www/processed_data/people.json","w") as people_file:
        json.dump(people, people_file)

    with open("www/processed_data/publications.json","w") as publications_file:
        json.dump(publications, publications_file)

    with open("www/processed_data/links.json","w") as links_file:
        json.dump(links, links_file)
            
            
def parse_eid(url):
    start = url.index("eid=")+4
    url = url[start:]
    end = url.index("&")
    url = url[:end]

    return(url)


if __name__ == "__main__":
    main()