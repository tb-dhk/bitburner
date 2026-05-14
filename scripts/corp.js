import { cityGroups } from "./common";
const cities = cityGroups.flat();

function makeid(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const industries = ["Agriculture", "Tobacco", "Chemical"];

const formulae = {
  Agriculture: {
    input: {
      Water: 0.5,
      Chemicals: 0.2,
    },
    output: {
      Plants: 1,
      Food: 1,
    },
  },
};

const exports = {
  Plants: ["Tobacco"],
};

const unlocks = [
  "Export",
  "Smart Supply",
  "Market Research - Demand",
  "Market Data - Competition",
  "Shady Accounting",
  "Government Partnership",
  "Warehouse API",
  "Office API",
];

const upgrades = [
  "Smart Factories",
  "Smart Storage",
  "Wilson Analytics",
  "Nuoptimal Nootropic Injector Implants",
  "Speech Processor Implants",
  "Neural Accelerators",
  "FocusWires",
  "ABC SalesBots",
  "Project Insight",
];

const research = [
  "Hi-Tech R&D Laboratory",
  "AutoBrew",
  "AutoPartyManager",
  "Automatic Drug Administration",
  "CPH4 Injections",
  "Drones",
  "Drones - Assembly",
  "Drones - Transport",
  "Go-Juice",
  "HRBuddy-Recruitment",
  "HRBuddy-Training",
  "Market-TA.I",
  "Market-TA.II",
  "Overclock",
  "Self-Correcting Assemblers",
  "Sti.mu",
  "uPgrade: Capacity.I",
  "uPgrade: Capacity.II",
  "uPgrade: Dashboard",
  "uPgrade: Fulcrum",
];

const jobs = [
  "Operations",
  "Engineer",
  "Business",
  "Management",
  "Research & Development",
  "Intern",
];

function assignEmployees(ns, divisionName) {
  const division = ns.corporation.getDivision(divisionName);
  const employeeJobs = Object.fromEntries(jobs.map((i) => [i, 0]));
  const cityJobs = Object.fromEntries(
    division.cities.map((i) => [
      i,
      Object.fromEntries(jobs.map((j) => [j, 0])),
    ]),
  );
  for (let city of cities) {
    if (division.cities.includes(city)) {
      let count = ns.corporation.getOffice(divisionName, city).numEmployees;

      const office = ns.corporation.getOffice(divisionName, city);
      if (
        (office.avgEnergy < 100 || office.avgMorale < 100) &&
        division.lastCycleRevenue - division.lastCycleExpenses < 1e6
      ) {
        const interns = Math.floor(count / 6);
        cityJobs[city].Intern = interns;
        count -= interns;
      } else {
        cityJobs[city].Intern = 0;
      }

      while (count > 0) {
        const min = Object.entries(employeeJobs)
          .filter((i) => i[0] !== "Intern")
          .sort((a, b) => a[1] - b[1])
          .map((i) => i[0])[0];
        employeeJobs[min] += 1;
        cityJobs[city][min] += 1;
        count -= 1;
      }
    }
  }
  return cityJobs;
}

function getDivisionName(ns, industry) {
  for (let division of ns.corporation.getCorporation().divisions) {
    if (ns.corporation.getDivision(division).industry === industry) {
      return division;
    }
  }
}

function totalProduction(ns, divisionName, city) {
  const production = ns.corporation.getOffice(
    divisionName,
    city,
  ).employeeProductionByJob;
  return Object.keys(production).reduce(
    (acc, value) => acc + production[value],
    0,
  );
}

/** @param {NS} ns */
export async function main(ns) {
  if (ns.corporation.hasCorporation()) {
  } else if (ns.corporation.canCreateCorporation(true)) {
    ns.corporation.createCorporation("tbdhk", true);
  } else {
    return;
  }

  let count = 0;

  while (true) {
    const divisions = ns.corporation.getCorporation().divisions;

    for (let industry of industries) {
      if (
        !divisions.some(
          (i) => ns.corporation.getDivision(i).industry === industry,
        ) &&
        ns.corporation.getCorporation().funds >=
          ns.corporation.getIndustryData(industry).startingCost
      ) {
        ns.corporation.expandIndustry(industry, industry);
      }
    }

    // unlocks
    while (true) {
      const money = ns.corporation.getCorporation().funds;
      const cheapestUnlock = unlocks.sort((a, b) => {
        if (a.endsWith("API") !== b.endsWith("API")) {
          return a.endsWith("API") ? -1 : 1;
        }
        return (
          ns.corporation.getUnlockCost(a) - ns.corporation.getUnlockCost(b)
        );
      })[0];
      if (money >= ns.corporation.getUnlockCost(cheapestUnlock) * 10) {
        ns.tprintf(`[corp] buying unlock ${cheapestUnlock}`);
        ns.corporation.purchaseUnlock(cheapestUnlock);
      } else {
        break;
      }
      await ns.sleep(100);
    }

    // upgrades
    while (true) {
      const money = ns.corporation.getCorporation().funds;
      const cheapestUpgrade = upgrades.sort(
        (a, b) =>
          ns.corporation.getUpgradeLevelCost(a) -
          ns.corporation.getUpgradeLevelCost(b),
      )[0];
      if (money >= ns.corporation.getUpgradeLevelCost(cheapestUpgrade) * 10) {
        const level = ns.corporation.getUpgradeLevel(cheapestUpgrade);
        ns.tprintf(
          `[corp] buying upgrade ${cheapestUpgrade} (level ${level + 1})`,
        );
        ns.corporation.levelUpgrade(cheapestUpgrade);
      } else {
        break;
      }
      await ns.sleep(100);
    }

    const smallestOfficeSize = Math.min(
      ...divisions
        .map((i) =>
          cities.map((j) => {
            let office = {};
            try {
              office = ns.corporation.getOffice(i, j);
            } catch {
              return Infinity;
            }
            return office.size;
          }),
        )
        .flat(),
    );

    // divisions
    for (let divisionName of divisions) {
      const division = ns.corporation.getDivision(divisionName);
      const industry = ns.corporation.getIndustryData(division.industry);
      const lastCycleProfit = Math.max(
        division.lastCycleRevenue - division.lastCycleExpenses,
        0,
      );
      const warehouses = cities.map((i) =>
        ns.corporation.hasWarehouse(divisionName, i),
      ).length;
      const jobAssignments = assignEmployees(ns, divisionName);

      // research
      while (true) {
        const points = ns.corporation.getDivision(divisionName).researchPoints;
        const cheapestUpgrade = research
          .filter((i) => {
            try {
              ns.corporation.getResearchCost(divisionName, i);
            } catch {
              return false;
            }
            return true;
          })
          .filter((i) => !ns.corporation.hasResearched(divisionName, i))
          .sort(
            (a, b) =>
              ns.corporation.getResearchCost(divisionName, a) -
              ns.corporation.getResearchCost(divisionName, b),
          )[0];
        if (
          points >=
          ns.corporation.getResearchCost(divisionName, cheapestUpgrade)
        ) {
          ns.tprintf(`[corp] ${divisionName}: researched ${cheapestUpgrade}`);
          ns.corporation.research(divisionName, cheapestUpgrade);
        } else {
          break;
        }
        await ns.sleep(100);
      }

      if (
        ns.corporation.getCorporation().funds >=
        ns.corporation.getHireAdVertCost(divisionName) * 10
      ) {
        ns.tprintf(`[corp] ${divisionName}: hired advert`);
        ns.corporation.hireAdVert(divisionName);
      }

      if (division.makesProducts) {
        if (division.products.length < 3) {
          const maxProduction = cities.sort(
            (a, b) =>
              totalProduction(ns, divisionName, b) -
              totalProduction(ns, divisionName, a),
          )[0];
          const funds = ns.corporation.getCorporation().funds;
          if (funds >= 2e9) {
            ns.corporation.makeProduct(
              divisionName,
              maxProduction,
              makeid(16),
              1e9,
              1e9,
            );
          }
        } else {
          const products = division.products;
          if (
            !products.some(
              (i) =>
                ns.corporation.getProduct(divisionName, "Sector-12", i)
                  .developmentProgress < 100,
            )
          ) {
            const worstProduct = products.sort(
              (a, b) =>
                ns.corporation.getProduct(divisionName, "Sector-12", a).rating -
                ns.corporation.getProduct(divisionName, "Sector-12", b).rating,
            )[0];
            ns.corporation.discontinueProduct(divisionName, worstProduct);
          }
        }
      }

      for (let city of cities) {
        if (ns.corporation.hasWarehouse(divisionName, city)) {
          // warehouse
          const warehouse = ns.corporation.getWarehouse(divisionName, city);
          if (
            warehouse.sizeUsed >= warehouse.size * 0.75 &&
            ns.corporation.getCorporation().funds >=
              ns.corporation.getUpgradeWarehouseCost(divisionName, city, 1) * 10
          ) {
            ns.tprintf(`[corp] ${divisionName} (${city}): upgraded warehouse`);
            ns.corporation.upgradeWarehouse(divisionName, city);
          }

          // only manage buying of material if smart supply has not been purchased
          if (!ns.corporation.hasUnlock("Smart Supply")) {
            const input = Object.entries(formulae[division.industry].input);
            const unitCost = input.reduce(
              (acc, [material, amount]) =>
                acc + ns.corporation.getMaterial(material).marketPrice * amount,
              0,
            );
            // number of units is based on how much revenue earned last round
            // divided by unit cost and number of warehouses
            // also divided by 10 because material bought is in seconds, and each cycle is 10 seconds
            const units =
              division.lastCycleRevenue /
              unitCost /
              division.cities.length /
              10;
            for (let [material, amount] of input) {
              if (
                ns.corporation.getMaterial(divisionName, city, material)
                  .stored <
                amount * units
              ) {
                ns.corporation.buyMaterial(divisionName, city, material);
              }
            }
          }

          // sell or export outputs of formulae
          if (division.makesProducts) {
            for (let product of ns.corporation.getDivision(divisionName)
              .products) {
              if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
                ns.corporation.setProductMarketTA2(divisionName, product, true);
              } else if (
                ns.corporation.hasResearched(divisionName, "Market-TA.II")
              ) {
                ns.corporation.setProductMarketTA1(divisionName, product, true);
              } else {
                ns.corporation.sellProduct(
                  divisionName,
                  city,
                  product,
                  "MAX",
                  "MP",
                );
              }
            }
          } else {
            const output = Object.entries(formulae[division.industry].output);
            for (let [material, _] of output) {
              const industries = exports[material];
              let sellAmount = "MAX";
              if (industries) {
                sellAmount = "MAX/2";
                for (let industry of industries) {
                  try {
                    ns.corporation.exportMaterial(
                      divisionName,
                      city,
                      getDivisionName(ns, industry),
                      city,
                      material,
                      "MAX/2",
                    );
                  } catch {}
                }
              }
              if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
                ns.corporation.setMaterialMarketTA2(
                  divisionName,
                  city,
                  material,
                  true,
                );
              } else if (
                ns.corporation.hasResearched(divisionName, "Market-TA.I")
              ) {
                ns.corporation.setMaterialMarketTA1(
                  divisionName,
                  city,
                  material,
                  true,
                );
              } else {
                ns.corporation.sellMaterial(
                  divisionName,
                  city,
                  material,
                  sellAmount,
                  "MP",
                );
              }
            }
          }

          // buying extra stuff to boost production
          const multipliers = {
            "AI Cores": industry.aiCoreFactor,
            Hardware: industry.hardwareFactor,
            "Real Estate": industry.realEstateFactor,
            Robots: industry.robotFactor,
          };
          const best = Object.keys(multipliers).sort(
            (a, b) => multipliers[b] - multipliers[a],
          )[0];
          const marketPrice = ns.corporation.getMaterial(
            divisionName,
            city,
            best,
          ).marketPrice;

          if (warehouse.sizeUsed >= warehouse.size * 0.75) {
            ns.corporation.buyMaterial(divisionName, city, best, 0);
            if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
              ns.corporation.setMaterialMarketTA2(
                divisionName,
                city,
                best,
                true,
              );
            } else if (
              ns.corporation.hasResearched(divisionName, "Market-TA.I")
            ) {
              ns.corporation.setMaterialMarketTA1(
                divisionName,
                city,
                best,
                true,
              );
            } else {
              ns.corporation.sellMaterial(
                divisionName,
                city,
                best,
                (warehouse.size - warehouse.sizeUsed) / 0.5,
                "MP",
              );
            }
          } else {
            ns.corporation.buyMaterial(
              divisionName,
              city,
              best,
              lastCycleProfit / warehouses / marketPrice / 2,
            );
            if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
              ns.corporation.setMaterialMarketTA2(
                divisionName,
                city,
                best,
                false,
              );
            } else if (
              ns.corporation.hasResearched(divisionName, "Market-TA.I")
            ) {
              ns.corporation.setMaterialMarketTA1(
                divisionName,
                city,
                best,
                false,
              );
            } else {
              ns.corporation.sellMaterial(divisionName, city, best, 0, "MP");
            }
          }
        } else {
          ns.corporation.purchaseWarehouse(divisionName, city);
        }

        if (ns.corporation.getDivision(divisionName).cities.includes(city)) {
          // office
          const office = ns.corporation.getOffice(divisionName, city);

          if (
            office.size === smallestOfficeSize &&
            ns.corporation.getCorporation().funds >=
              ns.corporation.getOfficeSizeUpgradeCost(divisionName, city, 1) *
                10
          ) {
            ns.corporation.upgradeOfficeSize(divisionName, city, 1);
            ns.tprintf(
              `[corp] ${divisionName} (${city}): upgraded office to ${office.size + 1} employees`,
            );
          }

          while (
            ns.corporation.getOffice(divisionName, city).numEmployees <
            ns.corporation.getOffice(divisionName, city).size
          ) {
            ns.corporation.hireEmployee(divisionName, city);
          }

          // reassign employees
          const employeeJobs = ns.corporation.getOffice(
            divisionName,
            city,
          ).employeeJobs;
          ns.corporation.setJobAssignment(divisionName, city, "Intern", 0);
          for (let job of jobs) {
            let setTo = jobAssignments[city][job];
            if (employeeJobs[job] && employeeJobs[job] < setTo) {
              setTo = 0;
            }
            try {
              ns.corporation.setJobAssignment(divisionName, city, job, setTo);
            } catch {}
          }

          // manage energy and morale
          if (lastCycleProfit >= 1e6) {
            if (
              !ns.corporation.hasResearched(divisionName, "AutoPartyManager") &&
              office.avgMorale < 90
            ) {
              const costPerEmployee =
                (10000000 / 22) *
                (Math.sqrt(1 + 44000 / office.avgMorale) - 21) *
                1.1;
              ns.corporation.throwParty(divisionName, city, costPerEmployee);
              ns.tprintf(
                `[corp] ${divisionName} (${city}): threw party for ${costPerEmployee * office.numEmployees}`,
              );
            }
            if (
              !ns.corporation.hasResearched(divisionName, "AutoBrew") &&
              office.avgEnergy < 98
            ) {
              ns.corporation.buyTea(divisionName, city);
              ns.tprintf(`[corp] ${divisionName} (${city}): bought tea`);
            }
          }
        } else {
          try {
            ns.corporation.expandCity(divisionName, city);
            ns.tprintf(`[corp] ${divisionName} (${city}): expanded`);
          } catch {}
        }
      }
    }
    while (true) {
      const next = await ns.corporation.nextUpdate();
      if (next === "START") {
        break;
      }
    }
    count += 1;
  }
}
