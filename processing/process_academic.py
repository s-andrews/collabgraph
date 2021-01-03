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
            year = sections[8]
            url = sections[10]
            eid = parse_eid(url)

            people_on_paper = []
            for i in range(2, 6):
                if sections[i] == "":
                    continue

                # Some sections have multiple people separated
                # by commas
                actual_people = sections[i].split(",")

                for person in actual_people:
                    person = person.strip().replace("\"","")
                    if not person in people:
                        if i < 4:
                            people[person] = {"name":person, "type":"GroupLeader"}
                        else:
                            people[person] = {"name":person, "type":"Facility"}
                    
                    people_on_paper.append(person)

            publications[eid] = {
                "authors": authors,
                "collaborators" : people_on_paper,
                "title" : title,
                "year" : year,
                "url" : url,
                "eid" : eid
            }

            for p1 in people_on_paper:
                for p2 in people_on_paper:
                    if p1 >= p2:
                        continue
                    links.append({"eid":eid, "from":p1, "to":p2})



    with open("raw_data/gl_industry.txt") as file:
        for line in file:
            sections = line.split("\t")
            if sections[0] == "Contract ID": 
                continue

            fromVal = sections[5].split(" ")[-1]
            toVal = sections[7]
            year = sections[3].split("/")[-1]

            if not fromVal in people:
                people[fromVal] = {"name":fromVal, "type":"GroupLeader"}

            if not toVal in people:
                people[toVal] = {"name":toVal, "type":"Company"}

            links.append({"eid":"", "from":fromVal, "to":toVal})

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